// autobump.go - Automatic version bumper for monorepo
// Usage: go run scripts/autobump.go [--cleanup]
package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
)

const (
	versionPattern = `^(\d+)\.(\d+)\.(\d+)$`
	stateFile      = ".git/autobump-state.json"
)

var rootVersionFiles = []string{"package.json", "lerna.json"}

var (
	rootDir         string
	versionRegex    = regexp.MustCompile(versionPattern)
	workspaces      []Workspace
	workspaceByDir  map[string]*Workspace
	managedFiles    map[string]bool
)

// AutobumpState tracks the current bump state
type AutobumpState struct {
	Head              string                       `json:"head"`
	Root              *AppliedVersion              `json:"root,omitempty"`
	TriggerSignatures map[string]string            `json:"triggerSignatures"`
	Workspaces        map[string]*AppliedVersion   `json:"workspaces"`
}

// AppliedVersion tracks version changes
type AppliedVersion struct {
	SourceVersion string `json:"sourceVersion"`
	TargetVersion string `json:"targetVersion"`
}

// Workspace represents a package in the monorepo
type Workspace struct {
	Name           string   `json:"name"`
	Dir            string   `json:"dir"`
	PackageJSON    string   `json:"packageJson"`
	ManagedFiles   []string `json:"managedFiles"`
}

func init() {
	var err error
	rootDir, err = git([]string{"rev-parse", "--show-toplevel"})
	if err != nil {
		panic(fmt.Sprintf("Failed to get git root: %v", err))
	}
	rootDir = strings.TrimSpace(rootDir)
}

func main() {
	if len(os.Args) > 1 && os.Args[1] == "--cleanup" {
		cleanup()
		return
	}

	loadWorkspaces()
	currentHead := strings.TrimSpace(mustGit([]string{"rev-parse", "HEAD"}))

	state := loadState()
	if state != nil && state.Head != currentHead {
		clearState()
		state = nil
	}

	if state == nil {
		state = &AutobumpState{
			Head:              currentHead,
			TriggerSignatures: make(map[string]string),
			Workspaces:        make(map[string]*AppliedVersion),
		}
	}

	stagedFiles := getStagedFiles()
	relevantEntries := collectRelevantEntries(stagedFiles)
	desiredWorkspaces := getDesiredWorkspaces(relevantEntries)
	shouldBumpRoot := len(relevantEntries) > 0

	if len(relevantEntries) == 0 {
		restoreAllAppliedVersions(state)
		clearState()
		return
	}

	// Restore workspaces that shouldn't be bumped
	for dir, applied := range state.Workspaces {
		if !desiredWorkspaces[dir] {
			restoreVersion(dir, applied.SourceVersion)
			delete(state.Workspaces, dir)
		}
	}

	// Restore root if not needed
	if !shouldBumpRoot && state.Root != nil {
		restoreRootVersion(state.Root.SourceVersion)
		state.Root = nil
	}

	// Bump desired workspaces
	for dir := range desiredWorkspaces {
		ws := workspaceByDir[dir]
		if ws == nil {
			continue
		}

		applied := state.Workspaces[dir]
		if applied == nil {
			sourceVersion := readVersion(ws.PackageJSON)
			targetVersion := incrementVersion(sourceVersion)
			applyVersion(ws, targetVersion)
			state.Workspaces[dir] = &AppliedVersion{
				SourceVersion: sourceVersion,
				TargetVersion: targetVersion,
			}
		} else {
			applyVersion(ws, applied.TargetVersion)
		}
	}

	// Bump root
	if shouldBumpRoot {
		if state.Root != nil {
			setRootVersion(state.Root.TargetVersion)
			stageFiles(rootVersionFiles)
		} else {
			sourceVersion := readVersion("package.json")
			targetVersion := incrementVersion(sourceVersion)
			setRootVersion(targetVersion)
			state.Root = &AppliedVersion{
				SourceVersion: sourceVersion,
				TargetVersion: targetVersion,
			}
			stageFiles(rootVersionFiles)
		}
	}

	// Update bun.lock if needed
	if shouldBumpRoot || len(desiredWorkspaces) > 0 {
		updateBunLockfile()
	}

	// Save signatures
	state.TriggerSignatures = make(map[string]string)
	for _, entry := range relevantEntries {
		state.TriggerSignatures[entry.Path] = entry.Signature
	}

	saveState(state)
}

// Workspace loading
func loadWorkspaces() {
	workspaces = []Workspace{}
	workspaceByDir = make(map[string]*Workspace)
	managedFiles = make(map[string]bool)

	// Load packages from packages/ directory
	packagesDir := filepath.Join(rootDir, "packages")
	entries, err := os.ReadDir(packagesDir)
	if err != nil {
		panic(fmt.Sprintf("Failed to read packages dir: %v", err))
	}

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		dir := filepath.Join("packages", entry.Name())
		pkgPath := filepath.Join(rootDir, dir, "package.json")

		if _, err := os.Stat(pkgPath); os.IsNotExist(err) {
			continue
		}

		data, err := os.ReadFile(pkgPath)
		if err != nil {
			continue
		}

		var pkg struct {
			Name string `json:"name"`
		}
		if err := json.Unmarshal(data, &pkg); err != nil {
			continue
		}

		ws := Workspace{
			Name:        pkg.Name,
			Dir:         dir,
			PackageJSON: filepath.Join(dir, "package.json"),
			ManagedFiles: []string{
				filepath.Join(dir, "package.json"),
			},
		}

		workspaces = append(workspaces, ws)
		workspaceByDir[dir] = &workspaces[len(workspaces)-1]
		for _, f := range ws.ManagedFiles {
			managedFiles[f] = true
		}
	}
}

// File operations
type RelevantEntry struct {
	Path      string
	Signature string
}

func getStagedFiles() []string {
	output, err := git([]string{"diff", "--cached", "--name-only", "--diff-filter=ACMRD", "-z"})
	if err != nil {
		return []string{}
	}

	files := []string{}
	for _, f := range strings.Split(output, "\x00") {
		f = strings.TrimSpace(f)
		if f != "" {
			files = append(files, f)
		}
	}
	return files
}

func collectRelevantEntries(files []string) []RelevantEntry {
	entries := []RelevantEntry{}

	for _, file := range files {
		if managedFiles[file] || file == "package.json" || file == "lerna.json" {
			normalizedStaged := readNormalizedContent(file, "staged")
			normalizedHead := readNormalizedContent(file, "head")
			if normalizedStaged == normalizedHead {
				continue
			}
			entries = append(entries, RelevantEntry{
				Path:      file,
				Signature: hashContent(normalizedStaged),
			})
		} else {
			entries = append(entries, RelevantEntry{
				Path:      file,
				Signature: getGenericFileSignature(file),
			})
		}
	}

	return entries
}

func getDesiredWorkspaces(entries []RelevantEntry) map[string]bool {
	result := make(map[string]bool)
	for _, entry := range entries {
		dir := findWorkspaceDir(entry.Path)
		if dir != "" {
			result[dir] = true
		}
	}
	return result
}

func findWorkspaceDir(file string) string {
	for _, ws := range workspaces {
		if strings.HasPrefix(file, ws.Dir+"/") || file == ws.Dir {
			return ws.Dir
		}
	}
	return ""
}

func getGenericFileSignature(file string) string {
	content := readGitFile(file, "staged")
	if content == "" {
		return "deleted"
	}
	return hashContent(content)
}

func readNormalizedContent(file, source string) string {
	content := readGitFile(file, source)
	if content == "" {
		return ""
	}
	// Normalize: remove version field
	if strings.HasSuffix(file, "package.json") || file == "lerna.json" {
		var data map[string]interface{}
		if err := json.Unmarshal([]byte(content), &data); err == nil {
			delete(data, "version")
			normalized, _ := json.MarshalIndent(data, "", "  ")
			return string(normalized)
		}
	}
	return content
}

func readGitFile(file, source string) string {
	var ref string
	if source == "staged" {
		ref = ":" + file
	} else {
		ref = "HEAD:" + file
	}

	content, err := git([]string{"show", ref})
	if err != nil {
		return ""
	}
	return content
}

// Version operations
func readVersion(file string) string {
	path := filepath.Join(rootDir, file)
	data, err := os.ReadFile(path)
	if err != nil {
		panic(fmt.Sprintf("Failed to read %s: %v", file, err))
	}

	var pkg struct {
		Version string `json:"version"`
	}
	if err := json.Unmarshal(data, &pkg); err != nil {
		panic(fmt.Sprintf("Failed to parse %s: %v", file, err))
	}

	if pkg.Version == "" {
		panic(fmt.Sprintf("No version in %s", file))
	}

	return pkg.Version
}

func setVersion(file, version string) {
	path := filepath.Join(rootDir, file)
	data, err := os.ReadFile(path)
	if err != nil {
		panic(fmt.Sprintf("Failed to read %s: %v", file, err))
	}

	var pkg map[string]interface{}
	if err := json.Unmarshal(data, &pkg); err != nil {
		panic(fmt.Sprintf("Failed to parse %s: %v", file, err))
	}

	pkg["version"] = version
	updated, err := json.MarshalIndent(pkg, "", "  ")
	if err != nil {
		panic(fmt.Sprintf("Failed to marshal %s: %v", file, err))
	}

	if err := os.WriteFile(path, append(updated, '\n'), 0644); err != nil {
		panic(fmt.Sprintf("Failed to write %s: %v", file, err))
	}
}

func setRootVersion(version string) {
	for _, file := range rootVersionFiles {
		setVersion(file, version)
	}
}

func restoreRootVersion(version string) {
	setRootVersion(version)
	stageFiles([]string{"lerna.json"})
}

func applyVersion(ws *Workspace, version string) {
	for _, file := range ws.ManagedFiles {
		setVersion(file, version)
	}
	stageFiles(ws.ManagedFiles)
}

func restoreVersion(dir string, version string) {
	ws := workspaceByDir[dir]
	if ws == nil {
		return
	}
	for _, file := range ws.ManagedFiles {
		setVersion(file, version)
	}
	stageFiles(ws.ManagedFiles)
}

func restoreAllAppliedVersions(state *AutobumpState) {
	for dir, applied := range state.Workspaces {
		restoreVersion(dir, applied.SourceVersion)
	}
	if state.Root != nil {
		restoreRootVersion(state.Root.SourceVersion)
	}
}

func incrementVersion(version string) string {
	match := versionRegex.FindStringSubmatch(version)
	if match == nil {
		panic(fmt.Sprintf("Invalid version format: %s", version))
	}

	major := match[1]
	minor := match[2]
	patch := match[3]

	patchNum := 0
	fmt.Sscanf(patch, "%d", &patchNum)
	patchNum++

	if patchNum >= 10 {
		minorNum := 0
		fmt.Sscanf(minor, "%d", &minorNum)
		minorNum++
		return fmt.Sprintf("%s.%d.0", major, minorNum)
	}

	return fmt.Sprintf("%s.%s.%d", major, minor, patchNum)
}

// Git operations
func stageFiles(files []string) {
	if len(files) == 0 {
		return
	}
	args := append([]string{"add", "--"}, files...)
	mustGit(args)
}

func updateBunLockfile() {
	cmd := exec.Command("bun", "install", "--lockfile-only")
	cmd.Dir = rootDir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		fmt.Fprintf(os.Stderr, "Warning: bun install --lockfile-only failed: %v\n", err)
		return
	}
	stageFiles([]string{"bun.lock"})
}

// State management
func loadState() *AutobumpState {
	path := filepath.Join(rootDir, stateFile)
	data, err := os.ReadFile(path)
	if err != nil {
		return nil
	}

	var state AutobumpState
	if err := json.Unmarshal(data, &state); err != nil {
		return nil
	}
	return &state
}

func saveState(state *AutobumpState) {
	path := filepath.Join(rootDir, stateFile)
	data, err := json.MarshalIndent(state, "", "  ")
	if err != nil {
		panic(fmt.Sprintf("Failed to marshal state: %v", err))
	}
	if err := os.WriteFile(path, append(data, '\n'), 0644); err != nil {
		panic(fmt.Sprintf("Failed to write state: %v", err))
	}
}

func clearState() {
	path := filepath.Join(rootDir, stateFile)
	os.Remove(path)
}

func cleanup() {
	clearState()
	fmt.Println("Autobump state cleaned up")
}

// Utilities
func hashContent(content string) string {
	h := sha256.New()
	h.Write([]byte(content))
	return hex.EncodeToString(h.Sum(nil))
}

func git(args []string) (string, error) {
	cmd := exec.Command("git", args...)
	cmd.Dir = rootDir
	out, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("git %s failed: %v (%s)", strings.Join(args, " "), err, string(out))
	}
	return string(out), nil
}

func mustGit(args []string) string {
	out, err := git(args)
	if err != nil {
		panic(err)
	}
	return out
}

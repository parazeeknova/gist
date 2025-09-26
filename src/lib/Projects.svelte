<script lang="ts">
	import gsap from 'gsap';
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';

	let isExpanded = false;
	let isMobile = false;
	let projectsButton: HTMLButtonElement;
	let projectsContent: HTMLDivElement;
	let projectsTimeline: gsap.core.Timeline | null = null;
	const dispatch = createEventDispatcher<{ expanded: boolean }>();

	function initProjectsAnimation() {
		if (!projectsButton || projectsTimeline) return;
		gsap.set(projectsButton, { '--underline-width': '0%' });
		projectsTimeline = gsap.timeline({ paused: true });
		projectsTimeline.fromTo(
			projectsButton,
			{ '--underline-width': '0%' },
			{ '--underline-width': '100%', duration: 0.4, ease: 'power2.out' }
		);
	}

	$: if (browser && projectsButton && !projectsTimeline) {
		initProjectsAnimation();
	}

	$: if (browser && projectsTimeline && projectsContent) {
		if (isExpanded) {
			projectsTimeline.play();
			gsap.fromTo(
				projectsContent,
				{ opacity: 0, y: -10 },
				{ opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
			);
		} else {
			projectsTimeline.reverse();
			gsap.to(projectsContent, { opacity: 0, y: -10, duration: 0.2, ease: 'power2.in' });
		}
	}

	onMount(() => {
		if (browser) {
			const checkMobile = () => {
				isMobile = window.innerWidth < 1024;
				if (!isMobile) {
					isExpanded = true;
				} else {
					isExpanded = false;
				}
			};
			checkMobile();
			window.addEventListener('resize', checkMobile);
			initProjectsAnimation();

			return () => window.removeEventListener('resize', checkMobile);
		}
	});

	$: if (browser) dispatch('expanded', isExpanded);
</script>

<div class="mb-4 space-y-3 sm:mb-6 sm:space-y-4">
	{#if isMobile}
		<div>
			<button
				bind:this={projectsButton}
				class="projects-link text-sm font-medium {isExpanded ? 'text-base' : 'text-base'}"
				on:click={() => (isExpanded = !isExpanded)}
			>
				<span>voo look what i made</span>
			</button>

			{#if isExpanded}
				<div bind:this={projectsContent} class="mt-3 space-y-4">
					<div>
						<h3 class="text-xs font-medium sm:text-sm">
							Zephyr is a Social media aggregator and platform
						</h3>
						<p class="mt-1 text-xs text-gray-500 sm:text-sm">
							Unified feeds from major networks with 10K+ views in beta, optimized API latency
							300ms→25ms via self-hosted stack.
						</p>
						<p class="mt-1 text-xs text-gray-400">
							Next.js, TypeScript, PostgreSQL, Redis, MinIO, Docker
						</p>
					</div>
					<div>
						<h3 class="text-xs font-medium sm:text-sm">Zephara is a Real-time chat platform</h3>
						<p class="mt-1 text-xs text-gray-500 sm:text-sm">
							Features threads, reactions, edits, media sharing with a modern interface in the
							Zephyr ecosystem.
						</p>
						<p class="mt-1 text-xs text-gray-400">Next.js, TypeScript, Convex, Vercel</p>
					</div>
					<div>
						<h3 class="text-xs font-medium sm:text-sm">Snix is a Terminal snippet manager</h3>
						<p class="mt-1 text-xs text-gray-500 sm:text-sm">
							Fast TUI with hierarchical notebooks, fuzzy search, syntax highlighting for 25+
							languages, and versioned storage.
						</p>
						<p class="mt-1 text-xs text-gray-400">Rust, Ratatui</p>
					</div>
					<div>
						<h3 class="text-xs font-medium sm:text-sm">
							Nyxtext Zenith is a Keyboard-first code editor
						</h3>
						<p class="mt-1 text-xs text-gray-500 sm:text-sm">
							Windows code editor with built-in terminal. Supports 35+ languages, code folding, Lua
							customization, and QScintilla-based editing.
						</p>
						<p class="mt-1 text-xs text-gray-400">Python, PyQt, QScintilla</p>
					</div>
					<div>
						<h3 class="text-xs font-medium sm:text-sm">Vue-the-World is a Travel tracker</h3>
						<p class="mt-1 text-xs text-gray-500 sm:text-sm">
							Full-stack travel tracker. Log visited places and visualize journeys on an interactive
							map.
						</p>
						<p class="mt-1 text-xs text-gray-400">Nuxt, Vue.js, TypeScript</p>
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<div>
			<h3 class="mb-2 text-base font-medium">voo look what i made</h3>
			<div class="space-y-3 sm:space-y-4">
				<div>
					<h3 class="text-xs font-medium sm:text-sm">
						Zephyr is a Social media aggregator and platform
					</h3>
					<p class="text-xs text-gray-500 sm:text-sm">
						Unified feeds from major networks with 10K+ views in beta, optimized API latency
						300ms→25ms via self-hosted stack.
					</p>
					<p class="mt-1 text-xs text-gray-400">
						Next.js, TypeScript, PostgreSQL, Redis, MinIO, Docker
					</p>
				</div>
				<div>
					<h3 class="text-xs font-medium sm:text-sm">Zephara is a Real-time chat platform</h3>
					<p class="text-xs text-gray-500 sm:text-sm">
						Features threads, reactions, edits, media sharing with a modern interface in the Zephyr
						ecosystem.
					</p>
					<p class="mt-1 text-xs text-gray-400">Next.js, TypeScript, Convex, Vercel</p>
				</div>
				<div>
					<h3 class="text-xs font-medium sm:text-sm">Snix is a Terminal snippet manager</h3>
					<p class="text-xs text-gray-500 sm:text-sm">
						Fast TUI with hierarchical notebooks, fuzzy search, syntax highlighting for 25+
						languages, and versioned storage.
					</p>
					<p class="mt-1 text-xs text-gray-400">Rust, Ratatui</p>
				</div>
				<div>
					<h3 class="text-xs font-medium sm:text-sm">
						Nyxtext Zenith is a Keyboard-first code editor
					</h3>
					<p class="text-xs text-gray-500 sm:text-sm">
						Windows code editor with built-in terminal. Supports 35+ languages, code folding, Lua
						customization, and QScintilla-based editing.
					</p>
					<p class="mt-1 text-xs text-gray-400">Python, PyQt, QScintilla</p>
				</div>
				<div>
					<h3 class="text-xs font-medium sm:text-sm">Vue-the-World is a Travel tracker</h3>
					<p class="text-xs text-gray-500 sm:text-sm">
						Full-stack travel tracker. Log visited places and visualize journeys on an interactive
						map.
					</p>
					<p class="mt-1 text-xs text-gray-400">Nuxt, Vue.js, TypeScript</p>
				</div>
			</div>
		</div>
	{/if}
</div>

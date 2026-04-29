export interface BlogManifestSection {
  label: string;
  children: BlogManifestPost[];
}

export interface BlogManifestPost {
  slug: string;
  title: string;
  section: string;
}

export const BLOG_MANIFEST: BlogManifestSection[] = [
  {
    children: [
      {
        section: "distributed-systems",
        slug: "crdts-101-a-primer",
        title: "CRDTs 101: A Primer",
      },
    ],
    label: "distributed-systems",
  },
];

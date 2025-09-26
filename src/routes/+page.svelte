<script lang="ts">
	import Dithering from '../lib/Dithering.svelte';
	import gsap from 'gsap';
	import { onMount, onDestroy } from 'svelte';

	let isDarkMode = true;
	let leftPanel: HTMLDivElement;
	let ditheringContainer: HTMLDivElement;
	let mainContainer: HTMLDivElement;
	let isMobile = false;
	let portfolioLink: HTMLAnchorElement;
	let githubLink: HTMLAnchorElement;
	let linkedinLink: HTMLAnchorElement;
	let twitterLink: HTMLAnchorElement;

	function toggleTheme() {
		isDarkMode = !isDarkMode;
	}

	function checkMobile() {
		if (typeof window !== 'undefined') {
			isMobile = window.innerWidth < 1024;
		}
	}

	onMount(() => {
		checkMobile();
		initLinkAnimations();
		if (typeof window !== 'undefined') {
			window.addEventListener('resize', checkMobile);
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', checkMobile);
		}
	});

	function initLinkAnimations() {
		const links = [portfolioLink, githubLink, linkedinLink, twitterLink].filter(Boolean);

		links.forEach((link) => {
			if (!link) return;
			const tl = gsap.timeline({ paused: true });
			tl.fromTo(
				link,
				{ '--underline-width': '0%' },
				{
					'--underline-width': '100%',
					duration: 0.3,
					ease: 'power2.out'
				}
			);

			link.addEventListener('mouseenter', () => tl.play());
			link.addEventListener('mouseleave', () => tl.reverse());
		});
	}

	$: if (mainContainer && leftPanel && ditheringContainer) {
		const tl = gsap.timeline();

		tl.to([leftPanel, ditheringContainer], {
			opacity: 0.6,
			duration: 0.2,
			ease: 'power2.in'
		});

		tl.to(
			leftPanel,
			{
				backgroundColor: isDarkMode ? '#000000' : '#ffffff',
				color: isDarkMode ? '#ffffff' : '#000000',
				duration: 0.8,
				ease: 'power2.inOut'
			},
			0.1
		);

		tl.to(
			mainContainer,
			{
				scale: 0.98,
				duration: 0.4,
				ease: 'power2.inOut',
				yoyo: true,
				repeat: 1
			},
			0.1
		);

		tl.to(
			[leftPanel, ditheringContainer],
			{
				opacity: 1,
				duration: 0.3,
				ease: 'power2.out'
			},
			0.7
		);
	}
</script>

<div
	class="relative grid min-h-screen grid-cols-1 overflow-hidden lg:h-screen lg:grid-cols-2"
	bind:this={mainContainer}
>
	<div
		bind:this={leftPanel}
		class="relative z-10 p-4 font-mono sm:p-6 lg:p-8 {isDarkMode
			? 'bg-black text-white'
			: 'bg-white text-black'}"
	>
		<button
			on:click={toggleTheme}
			class="absolute top-4 right-4 rounded-full p-2 transition-colors sm:top-6 sm:right-6 lg:top-8 lg:right-8 {isDarkMode
				? 'hover:bg-white/10'
				: 'hover:bg-black/10'}"
			aria-label="Toggle theme"
		>
			{#if isDarkMode}
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle cx="12" cy="12" r="5" />
					<path
						d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
					/>
				</svg>
			{:else}
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
				</svg>
			{/if}
		</button>

		<div class="mb-8 sm:mb-12">
			<h1 class="text-xl font-normal sm:text-2xl">Harsh Sahu</h1>
			<p class="mb-6 text-sm sm:mb-8 sm:text-base">
				<a
					bind:this={portfolioLink}
					href="https://folio.zephyyrr.in"
					target="_blank"
					rel="noopener noreferrer"
					class="link-underline"
				>
					designer portfolio
				</a>
			</p>
			<p class="text-sm leading-relaxed sm:text-base">
				Third-year CS undergrad · Fullstack & DevOps Engineer. President of the Mozilla Firefox
				Club. Building Zephyr a social aggregator with 18K+ views since its dev preview and founder
				of Singularity Works, a freelance design & dev studio. Previously a Fullstack Intern in
				Musqat, Oman. Active in open-source, national hackathon winner, and published research
				author (CICBA '25, AI).
			</p>
		</div>

		<div class="mb-8 space-y-3 sm:mb-12 sm:space-y-4">
			<div>
				<h3 class="text-xs font-medium sm:text-sm">
					Co-Founder <span class="mx-1 text-base font-light opacity-80">⟶</span> Singularity Works
				</h3>
				<p class="text-xs text-gray-500 sm:text-sm">
					On-Site (Bhopal, India) | August 2025–Present
				</p>
			</div>
			<div>
				<h3 class="text-xs font-medium sm:text-sm">
					Full Stack Developer Intern <span class="mx-1 text-base font-light opacity-80">⟶</span> amasQIS.ai
				</h3>
				<p class="text-xs text-gray-500 sm:text-sm">Remote (Muscat, Oman) | April 2025–Present</p>
			</div>
			<div>
				<h3 class="text-xs font-medium sm:text-sm">
					President <span class="mx-1 text-base font-light opacity-80">⟶</span> Mozilla Firefox Club
				</h3>
				<p class="text-xs text-gray-500 sm:text-sm">On-Site (Bhopal, India) | June 2025–Present</p>
			</div>
		</div>

		<div
			class="absolute bottom-4 left-4 flex space-x-6 sm:bottom-6 sm:left-6 lg:bottom-8 lg:left-8"
		>
			<a
				bind:this={githubLink}
				href="https://github.com/parazeeknova"
				target="_blank"
				rel="noopener noreferrer"
				class="link-underline text-xs sm:text-sm"
				aria-label="GitHub"
			>
				GitHub
			</a>
			<a
				bind:this={linkedinLink}
				href="https://linkedin.com/in/hashkharshsahu"
				target="_blank"
				rel="noopener noreferrer"
				class="link-underline text-xs sm:text-sm"
				aria-label="LinkedIn"
			>
				LinkedIn
			</a>
			<a
				bind:this={twitterLink}
				href="https://x.com/hashcodes_"
				target="_blank"
				rel="noopener noreferrer"
				class="link-underline text-xs sm:text-sm"
				aria-label="X"
			>
				X
			</a>
		</div>
	</div>

	<div class="relative" bind:this={ditheringContainer}>
		<Dithering
			width="100%"
			height="100%"
			fit="cover"
			colorBack={isDarkMode ? 'hsl(0, 0%, 0%)' : 'hsl(0, 0%, 95%)'}
			colorFront={isDarkMode ? 'hsl(320, 100%, 70%)' : 'hsl(220, 100%, 70%)'}
			shape={isMobile ? 'wave' : 'simplex'}
			type="4x4"
			pxSize={3}
			offsetX={0}
			offsetY={0}
			scale={0.8}
			rotation={0}
			speed={0.1}
		/>
	</div>
</div>

<style>
	.link-underline {
		position: relative;
		text-decoration: none;
		transition: opacity 0.2s ease;
	}

	.link-underline::after {
		content: '';
		position: absolute;
		bottom: -2px;
		left: 0;
		width: var(--underline-width, 0%);
		height: 1px;
		background-color: currentColor;
		transition: width 0.3s ease;
	}

	.link-underline:hover {
		opacity: 1;
	}
</style>

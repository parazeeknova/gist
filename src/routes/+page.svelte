<script lang="ts">
	import Dithering from '../lib/Dithering.svelte';
	import Projects from '../lib/Projects.svelte';
	import gsap from 'gsap';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	let isDarkMode = true;
	let leftPanel: HTMLDivElement;
	let ditheringContainer: HTMLDivElement;
	let mainContainer: HTMLDivElement;
	let isMobile = false;
	let themeButton: HTMLButtonElement;
	let themeIndicator: HTMLSpanElement;
	let portfolioLink: HTMLAnchorElement;
	let zephyrLink: HTMLAnchorElement;
	let singularityLink: HTMLAnchorElement;
	let githubLink: HTMLAnchorElement;
	let linkedinLink: HTMLAnchorElement;
	let twitterLink: HTMLAnchorElement;
	let isProjectsExpanded = false;
	let ditheringColorBack = isDarkMode ? 'hsl(0, 0%, 0%)' : 'hsl(0, 0%, 95%)';
	let ditheringColorFront = isDarkMode ? 'hsl(360, 0%, 76%)' : 'hsl(220, 100%, 70%)';
	let removeThemeHoverHandlers: (() => void) | null = null;

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
		if (browser) {
			initLinkAnimations();
			initThemeSwitcherAnimation();
		}
		if (typeof window !== 'undefined') {
			window.addEventListener('resize', checkMobile);
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', checkMobile);
		}
		if (removeThemeHoverHandlers) removeThemeHoverHandlers();
	});

	function initLinkAnimations() {
		const links = [
			portfolioLink,
			zephyrLink,
			singularityLink,
			githubLink,
			linkedinLink,
			twitterLink
		].filter(Boolean);

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
			// Prevent dragging of links
			link.setAttribute('draggable', 'false');
			link.addEventListener('dragstart', (e) => e.preventDefault());
		});
	}

	function initThemeSwitcherAnimation() {
		if (!themeButton || !themeIndicator) return;
		const enter = () => {
			if (!browser) return;
			const color = getComputedStyle(themeButton).color;
			gsap.to(themeIndicator, {
				backgroundColor: color,
				borderWidth: 0,
				duration: 0.18,
				ease: 'power2.out'
			});
		};
		const leave = () => {
			gsap.to(themeIndicator, {
				backgroundColor: 'rgba(0,0,0,0)',
				borderWidth: 1,
				duration: 0.18,
				ease: 'power2.in'
			});
		};
		themeButton.addEventListener('mouseenter', enter);
		themeButton.addEventListener('mouseleave', leave);
		themeButton.addEventListener('focus', enter);
		themeButton.addEventListener('blur', leave);
		removeThemeHoverHandlers = () => {
			themeButton.removeEventListener('mouseenter', enter);
			themeButton.removeEventListener('mouseleave', leave);
			themeButton.removeEventListener('focus', enter);
			themeButton.removeEventListener('blur', leave);
		};
	}

	$: if (browser && mainContainer && leftPanel && ditheringContainer) {
		const tl = gsap.timeline();

		tl.to([leftPanel, ditheringContainer], {
			opacity: 0.6,
			duration: 0.2,
			ease: 'power2.in'
		});

		tl.to(
			leftPanel,
			{
				backgroundColor: isDarkMode ? '#000000' : 'hsl(0, 0%, 95%)',
				color: isDarkMode ? '#ffffff' : '#000000',
				duration: 0.8,
				ease: 'power2.inOut'
			},
			0.1
		);

		tl.to(
			{},
			{
				duration: 0.8,
				ease: 'power2.inOut',
				onUpdate: function () {
					const progress = this.progress();
					const startBack = isDarkMode ? [0, 0, 95] : [0, 0, 0];
					const endBack = isDarkMode ? [0, 0, 0] : [0, 0, 95];
					const startFront = isDarkMode ? [220, 100, 70] : [360, 0, 76];
					const endFront = isDarkMode ? [360, 0, 76] : [220, 100, 70];

					const currentBack = startBack.map((start, i) =>
						Math.round(start + (endBack[i] - start) * progress)
					);
					const currentFront = startFront.map((start, i) =>
						Math.round(start + (endFront[i] - start) * progress)
					);

					ditheringColorBack = `hsl(${currentBack[0]}, ${currentBack[1]}%, ${currentBack[2]}%)`;
					ditheringColorFront = `hsl(${currentFront[0]}, ${currentFront[1]}%, ${currentFront[2]}%)`;
				}
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
		class="relative z-10 cursor-default p-4 font-mono select-none sm:p-6 lg:p-8 {isDarkMode
			? 'bg-black text-white'
			: 'bg-[hsl(0,0%,95%)] text-black'}"
	>
		<button
			bind:this={themeButton}
			on:click={toggleTheme}
			class="absolute top-4 right-4 rounded-full p-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-current/40 sm:top-6 sm:right-6 lg:top-8 lg:right-8"
			aria-label="Toggle theme"
		>
			<span class="sr-only">Toggle theme</span>
			<span
				bind:this={themeIndicator}
				class="block h-3 w-3 rounded-full border border-current"
				style="background-color: transparent;"
			></span>
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
					<span class="ml-1">↗</span>
				</a>
			</p>
			<p class="text-sm leading-relaxed sm:text-base">
				Engineer and founder, building web platforms, infrastructure, and tools. Creator of <a
					bind:this={zephyrLink}
					href="https://zephyyrr.in"
					target="_blank"
					rel="noopener noreferrer"
					class="link-underline">Zephyr</a
				>. Runs
				<a
					bind:this={singularityLink}
					href="https://singularityworks.xyz"
					target="_blank"
					rel="noopener noreferrer"
					class="link-underline">Singularity Works</a
				>, a freelance design and development studio. CS undergrad, active in open-source and
				hackathons.
			</p>
		</div>

		<div>
			<h3 class="mb-2 text-base font-medium">work stuff i guess</h3>
		</div>

		<div class="mb-8 space-y-3 sm:mb-12 sm:space-y-4">
			<div>
				<h3 class="text-xs font-medium sm:text-sm">Co-Founder — Singularity Works</h3>
				<p class="text-xs text-gray-500 sm:text-sm">
					On-Site (Bhopal, India) | August 2025–Present
				</p>
			</div>
			<div>
				<h3 class="text-xs font-medium sm:text-sm">Full Stack Developer Intern — amasQIS.ai</h3>
				<p class="text-xs text-gray-500 sm:text-sm">Remote (Muscat, Oman) | April 2025–Present</p>
			</div>
			<div>
				<h3 class="text-xs font-medium sm:text-sm">President — Mozilla Firefox Club</h3>
				<p class="text-xs text-gray-500 sm:text-sm">On-Site (Bhopal, India) | June 2025–Present</p>
			</div>
		</div>

		<Projects on:expanded={(e) => (isProjectsExpanded = e.detail)} />

		<div
			class="absolute bottom-4 left-4 flex space-x-6 sm:bottom-6 sm:left-6 lg:bottom-8 lg:left-8"
			style={isMobile && isProjectsExpanded ? 'display:none' : ''}
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
				href="https://www.linkedin.com/in/hashk"
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
			colorBack={ditheringColorBack}
			colorFront={ditheringColorFront}
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

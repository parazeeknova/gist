<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { ShaderMount, type ShaderMountUniforms } from '../shaders/shader-mount';
	import {
		getShaderColorFromString,
		ditheringFragmentShader,
		ShaderFitOptions,
		type DitheringUniforms,
		type DitheringParams,
		type ShaderPreset,
		defaultPatternSizing,
		defaultObjectSizing,
		DitheringShapes,
		DitheringTypes
	} from '../shaders/dithering';
	import type { ShaderSizingParams, ShaderSizingUniforms } from '../shaders/shader-sizing';

	// Extended uniform interface that accepts strings for images
	interface DitheringUniformsReact {
		[key: string]: string | boolean | number | number[] | number[][] | HTMLImageElement | undefined;
	}

	export let speed = 1;
	export let frame = 0;
	export let colorBack = '#000000';
	export let colorFront = '#00b2ff';
	export let shape: 'simplex' | 'warp' | 'dots' | 'wave' | 'ripple' | 'swirl' | 'sphere' = 'sphere';
	export let type: 'random' | '2x2' | '4x4' | '8x8' = '4x4';
	export let pxSize = 2;

	// Sizing props
	export let fit: 'none' | 'contain' | 'cover' = 'contain';
	export let scale = 0.6;
	export let rotation = 0;
	export let originX = 0.5;
	export let originY = 0.5;
	export let offsetX = 0;
	export let offsetY = 0;
	export let worldWidth = 0;
	export let worldHeight = 0;

	// Additional props for ShaderMount
	export let minPixelRatio = 2;
	export let maxPixelCount = 1920 * 1080 * 4;
	export let webGlContextAttributes: WebGLContextAttributes | undefined = undefined;
	export let width: string | number | undefined = undefined;
	export let height: string | number | undefined = undefined;

	let container: HTMLDivElement;
	let shaderMount: ShaderMount | null = null;
	let isInitialized = false;

	const dispatch = createEventDispatcher();

	// Parse the provided uniforms, turning URL strings into loaded images
	async function processUniforms(
		uniformsProp: DitheringUniformsReact
	): Promise<ShaderMountUniforms> {
		const processedUniforms = {} as ShaderMountUniforms;
		const imageLoadPromises: Promise<void>[] = [];

		const isValidUrl = (url: string): boolean => {
			try {
				// Handle absolute paths
				if (url.startsWith('/')) return true;
				// Check if it's a valid URL
				new URL(url);
				return true;
			} catch {
				return false;
			}
		};

		const isExternalUrl = (url: string): boolean => {
			try {
				if (url.startsWith('/')) return false;
				const urlObject = new URL(url, window.location.origin);
				return urlObject.origin !== window.location.origin;
			} catch {
				return false;
			}
		};

		Object.entries(uniformsProp).forEach(([key, value]) => {
			if (typeof value === 'string') {
				// Make sure the provided string is a valid URL or just skip trying to set this uniform entirely
				if (!isValidUrl(value)) {
					console.warn(`Uniform "${key}" has invalid URL "${value}". Skipping image loading.`);
					return;
				}

				const imagePromise = new Promise<void>((resolve, reject) => {
					const img = new Image();
					if (isExternalUrl(value)) {
						img.crossOrigin = 'anonymous';
					}
					img.onload = () => {
						processedUniforms[key] = img;
						resolve();
					};
					img.onerror = () => {
						console.error(`Could not set uniforms. Failed to load image at ${value}`);
						reject();
					};
					img.src = value;
				});
				imageLoadPromises.push(imagePromise);
			} else {
				processedUniforms[key] = value;
			}
		});

		await Promise.all(imageLoadPromises);
		return processedUniforms;
	}

	// Create uniforms object
	$: uniforms = (() => {
		return {
			// Own uniforms
			u_colorBack: getShaderColorFromString(colorBack),
			u_colorFront: getShaderColorFromString(colorFront),
			u_shape: DitheringShapes[shape],
			u_type: DitheringTypes[type],
			u_pxSize: pxSize,

			// Sizing uniforms
			u_fit: ShaderFitOptions[fit],
			u_scale: scale,
			u_rotation: rotation,
			u_offsetX: offsetX,
			u_offsetY: offsetY,
			u_originX: originX,
			u_originY: originY,
			u_worldWidth: worldWidth,
			u_worldHeight: worldHeight
		} satisfies DitheringUniforms;
	})();

	// Update uniforms when they change
	$: if (isInitialized && shaderMount && uniforms) {
		updateUniforms();
	}

	async function initShader() {
		if (!container || shaderMount) return;

		const processedUniforms = await processUniforms(uniforms);

		shaderMount = new ShaderMount(
			container,
			ditheringFragmentShader,
			processedUniforms,
			webGlContextAttributes,
			speed,
			frame,
			minPixelRatio,
			maxPixelCount
		);

		isInitialized = true;
		dispatch('ready');
	}

	async function updateUniforms() {
		if (!shaderMount || !isInitialized) return;

		const processedUniforms = await processUniforms(uniforms);
		shaderMount.setUniforms(processedUniforms);
	}

	onMount(() => {
		initShader();
	});

	onDestroy(() => {
		if (shaderMount) {
			shaderMount.dispose();
			shaderMount = null;
		}
	});

	// Update uniforms when they change
	$: if (isInitialized && shaderMount) {
		updateUniforms();
	}

	// Update speed when it changes
	$: if (isInitialized && shaderMount) {
		shaderMount.setSpeed(speed);
	}

	// Update frame when it changes
	$: if (isInitialized && shaderMount) {
		shaderMount.setFrame(frame);
	}

	// Update max pixel count when it changes
	$: if (isInitialized && shaderMount) {
		shaderMount.setMaxPixelCount(maxPixelCount);
	}

	// Update min pixel ratio when it changes
	$: if (isInitialized && shaderMount) {
		shaderMount.setMinPixelRatio(minPixelRatio);
	}

	// Export methods for external control
	export function setSpeed(newSpeed: number) {
		speed = newSpeed;
	}

	export function setFrame(newFrame: number) {
		frame = newFrame;
	}

	export function setMaxPixelCount(newMaxPixelCount: number) {
		maxPixelCount = newMaxPixelCount;
	}

	export function setMinPixelRatio(newMinPixelRatio: number) {
		minPixelRatio = newMinPixelRatio;
	}

	export function getCurrentFrame(): number {
		return shaderMount?.getCurrentFrame() ?? 0;
	}
</script>

<div
	bind:this={container}
	style:width={width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined}
	style:height={height !== undefined
		? typeof height === 'number'
			? `${height}px`
			: height
		: undefined}
	{...$$restProps}
>
	<slot />
</div>

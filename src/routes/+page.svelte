<script>
	import Dithering from '../lib/Dithering.svelte';
	import { ditheringPresets } from '../shaders/dithering';

	let selectedPreset = ditheringPresets[0];
	let currentPresetIndex = 0;

	function nextPreset() {
		currentPresetIndex = (currentPresetIndex + 1) % ditheringPresets.length;
		selectedPreset = ditheringPresets[currentPresetIndex];
	}

	function prevPreset() {
		currentPresetIndex =
			currentPresetIndex === 0 ? ditheringPresets.length - 1 : currentPresetIndex - 1;
		selectedPreset = ditheringPresets[currentPresetIndex];
	}
</script>

<div class="container">
	<h1>Dithering Effects</h1>
	<p>A collection of animated dithering patterns created with WebGL shaders</p>

	<div class="demo-section">
		<div class="controls">
			<button on:click={prevPreset}>← Previous</button>
			<h2>{selectedPreset.name}</h2>
			<button on:click={nextPreset}>Next →</button>
		</div>

		<div class="dithering-container">
			<Dithering
				width="100%"
				height="400px"
				speed={selectedPreset.params.speed}
				frame={selectedPreset.params.frame}
				colorBack={selectedPreset.params.colorBack}
				colorFront={selectedPreset.params.colorFront}
				shape={selectedPreset.params.shape}
				type={selectedPreset.params.type}
				pxSize={selectedPreset.params.pxSize}
				fit={selectedPreset.params.fit}
				scale={selectedPreset.params.scale}
				rotation={selectedPreset.params.rotation}
				originX={selectedPreset.params.originX}
				originY={selectedPreset.params.originY}
				offsetX={selectedPreset.params.offsetX}
				offsetY={selectedPreset.params.offsetY}
				worldWidth={selectedPreset.params.worldWidth}
				worldHeight={selectedPreset.params.worldHeight}
			/>
		</div>
	</div>

	<div class="presets-grid">
		{#each ditheringPresets as preset}
			<div class="preset-item">
				<h3>{preset.name}</h3>
				<div class="preset-preview">
					<Dithering
						width="100%"
						height="200px"
						speed={preset.params.speed}
						frame={preset.params.frame}
						colorBack={preset.params.colorBack}
						colorFront={preset.params.colorFront}
						shape={preset.params.shape}
						type={preset.params.type}
						pxSize={preset.params.pxSize}
						fit={preset.params.fit}
						scale={preset.params.scale}
						rotation={preset.params.rotation}
						originX={preset.params.originX}
						originY={preset.params.originY}
						offsetX={preset.params.offsetX}
						offsetY={preset.params.offsetY}
						worldWidth={preset.params.worldWidth}
						worldHeight={preset.params.worldHeight}
					/>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	h1 {
		text-align: center;
		color: #333;
		margin-bottom: 0.5rem;
	}

	.container > p {
		text-align: center;
		color: #666;
		margin-bottom: 3rem;
	}

	.demo-section {
		margin-bottom: 3rem;
	}

	.controls {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.controls button {
		padding: 0.5rem 1rem;
		background: #007acc;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
	}

	.controls button:hover {
		background: #005999;
	}

	.controls h2 {
		margin: 0;
		color: #333;
		font-size: 1.5rem;
	}

	.dithering-container {
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.presets-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
	}

	.preset-item {
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		background: white;
	}

	.preset-item h3 {
		margin: 0;
		padding: 1rem;
		background: #f8f9fa;
		text-align: center;
		font-size: 1.1rem;
		color: #333;
	}

	.preset-preview {
		height: 200px;
		overflow: hidden;
	}
</style>

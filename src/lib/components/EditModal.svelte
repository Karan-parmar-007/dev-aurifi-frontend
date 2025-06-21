<script lang="ts">
	let { data } = $props();
	console.log($state.snapshot(data));
</script>

<div class="z-20 flex h-[100vh] w-[100vw] items-center justify-center bg-white/30 backdrop-blur-none">
	<div class="bg-white">edit modal</div>
</div>

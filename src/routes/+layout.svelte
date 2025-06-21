<script lang="ts">
	import BreakDownModal from '$lib/components/BreakDownModal.svelte';
	import ConfirmDelete from '$lib/components/ConfirmDelete.svelte';
	import SideBar from '$lib/components/SideBar.svelte';
	import '../app.css';
	let { children } = $props();
</script>

<SideBar />

<BreakDownModal />

{@render children()}

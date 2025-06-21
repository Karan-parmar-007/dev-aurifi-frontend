<script lang="ts">
	import AdminNavBar from '$lib/components/adminNavBar.svelte';
	let { children } = $props();
</script>


<AdminNavBar />

{@render children()}

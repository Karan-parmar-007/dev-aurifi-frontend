<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import BreadCrumb from '$lib/components/BreadCrumb.svelte';
	import CustomTable from '$lib/components/CustomTable.svelte';
	import { Button } from 'flowbite-svelte';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	let { data } = $props();
	console.log('Data received:', data); // Debug log to inspect data
	let page_url = page.url.pathname;
	let urlParts = page_url.split('/');
	const fileData = data.result?.data; // Safely access data.result
	let isLoading = $state(false);
	let errorMessage = $state<string | null>(null); // State for error message

	let currentFile = $state('');

	onMount(() => {
		if (browser) {
			currentFile = localStorage.getItem('currentFile') || 'No file selected';
		}
	});

	// Validate fileData and set error if necessary
	$effect(() => {
		if (!fileData) {
			errorMessage = 'File Not Found!';
			return;
		}
		if (!fileData.columns || !Array.isArray(fileData.columns)) {
			errorMessage = 'Invalid data format: Columns are missing or invalid.';
			return;
		}
		if (!fileData.rows || !Array.isArray(fileData.rows)) {
			errorMessage = 'Invalid data format: Rows are missing or invalid.';
			return;
		}
		errorMessage = null; // Clear error if data is valid
	});

	const allColumns = fileData?.columns ?? []; // Fallback to empty array
	const initialColumnsToDisplay = allColumns.slice(0, 10);

	function redirectToColumnMapping() {
		goto(`/Transactions/column_mapping/${urlParts[3]}`);
	}
</script>

<div class="flex h-[100vh] w-full flex-col">
	<div class="flex w-full items-center gap-4 px-16 pt-14">
		<svg width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
			<g clip-path="url(#clip0_2066_4085)">
				<path
					d="M20.4338 8.69904C20.4333 8.69858 20.4329 8.69812 20.4324 8.69766L11.866 0.539551C11.5009 0.19165 11.0154 0 10.4991 0C9.98268 0 9.49722 0.191498 9.13193 0.539398L0.570075 8.69339C0.567191 8.69614 0.564307 8.69904 0.561423 8.70178C-0.188394 9.42001 -0.187112 10.5853 0.565108 11.3017C0.908774 11.6292 1.36267 11.8188 1.84797 11.8387C1.86767 11.8405 1.88754 11.8414 1.90757 11.8414H2.24899V17.8453C2.24899 19.0334 3.26397 20 4.51174 20H7.86317C8.20283 20 8.4784 19.7377 8.4784 19.4141V14.707C8.4784 14.1649 8.94143 13.7239 9.51068 13.7239H11.4874C12.0567 13.7239 12.5197 14.1649 12.5197 14.707V19.4141C12.5197 19.7377 12.7951 20 13.135 20H16.4864C17.7342 20 18.7491 19.0334 18.7491 17.8453V11.8414H19.0657C19.5819 11.8414 20.0674 11.6499 20.4329 11.302C21.1859 10.5844 21.1862 9.41711 20.4338 8.69904Z"
					fill="#242C3E"
				/>
			</g>
			<defs>
				<clipPath id="clip0_2066_4085">
					<rect width="21" height="20" fill="white" />
				</clipPath>
			</defs>
		</svg>
		<svg width="7" height="11" viewBox="0 0 7 11" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M7 6.09783L0 11V9.08696L5.36957 5.52989L5.32609 5.64946V5.35054L5.36957 5.47011L0 1.91304V0L7 4.90217V6.09783Z"
				fill="black"
				fill-opacity="0.28"
			/>
		</svg>
		<h1 class="text-xl font-semibold">{currentFile}</h1>
	</div>
	<div class="h-full px-20">
		<BreadCrumb />
		<div class="relative flex flex-col gap-6 px-4">
			<h2 class="font-semibold">Debt Sheet Overview</h2>
			{#if isLoading}
				<p>Loading...</p>
			{:else if errorMessage}
				<div class="rounded bg-red-100 p-4 text-red-500">
					<p>{errorMessage}</p>
				</div>
			{:else if fileData?.status === 'success'}
				<CustomTable
					data={fileData.rows}
					columns={allColumns}
					initialSelectedColumns={initialColumnsToDisplay}
				/>
			{:else}
				<h2>File Not Found!</h2>
			{/if}
		</div>
		<Button
			color="dark"
			class="bg-dark-100 float-right m-4 h-[38px] w-[144px]"
			onclick={() => {
				redirectToColumnMapping();
			}}
			disabled={!!errorMessage}
		>
			Fix Headers
		</Button>
	</div>
</div>

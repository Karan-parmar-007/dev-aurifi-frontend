<script lang="ts">
	import { VITE_API_URL } from '$lib/constants';
	import {
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Button
	} from 'flowbite-svelte';

	let {
		data,
		columns,
		initialSelectedColumns = null,
		file_name = null,
		showDownloadButton = false, // New prop with default value
		downloadPath = ''
	} = $props();

	// Track currently displayed columns - either use provided initialSelectedColumns or show first 10 columns
	let selectedColumns = $state(initialSelectedColumns || columns.slice(0, 10));
	// Track temporary checkbox selections in the dropdown
	let tempSelectedColumns = $state([...selectedColumns]);
	let displayDropDown = $state(false);

	// Update totalRows to reflect the number of data rows
	let totalRows = $derived(data.length);

	// Toggle temporary column selection
	const toggleTempColumn = (column: string) => {
		if (tempSelectedColumns.includes(column)) {
			// Prevent deselecting all columns
			if (tempSelectedColumns.length > 1) {
				tempSelectedColumns = tempSelectedColumns.filter((col) => col !== column);
			}
		} else {
			tempSelectedColumns = [...tempSelectedColumns, column];
		}
	};

	// Apply filter: update selectedColumns with tempSelectedColumns
	const filterColumn = () => {
		selectedColumns = [...tempSelectedColumns]; // Apply temporary selections
		displayDropDown = false; // Close dropdown
	};

	// Reset temporary selections when opening dropdown
	const openDropdown = () => {
		tempSelectedColumns = [...selectedColumns]; // Reset to current selected columns
		displayDropDown = true;
	};

	// Cancel changes by closing dropdown without applying
	const cancelFilter = () => {
		displayDropDown = false; // Close dropdown without applying
	};
	const downloadFile = async (file_path: string) => {
		try {
			console.log(file_path);
			// Use query parameter instead of path parameter
			const downloadUrl = `${VITE_API_URL}/project/download_file?file_path=${encodeURIComponent(file_path)}`;
			console.log('Download URL:', downloadUrl);

			// Fetch the file with proper headers
			const response = await fetch(downloadUrl, {
				method: 'GET',
				headers: {
					// Add any authentication headers if needed
					// 'Authorization': `Bearer ${token}`
				}
			});

			if (!response.ok) {
				throw new Error(`Download failed: ${response.statusText}`);
			}

			// Create blob from response
			const blob = await response.blob();

			// Create temporary URL for the blob
			const blobUrl = window.URL.createObjectURL(blob);

			// Extract filename from path or use default
			const filename = file_path.split('/').pop() || 'download.xlsx';

			// Create temporary anchor element and trigger download
			const a = document.createElement('a');
			a.href = blobUrl;
			a.download = filename;
			a.style.display = 'none';
			document.body.appendChild(a);
			a.click();

			// Cleanup
			document.body.removeChild(a);
			window.URL.revokeObjectURL(blobUrl);

			console.log('Download completed successfully');
		} catch (error) {
			console.error('Error downloading file:', error);
			// You might want to show a toast/notification to the user here
			alert('Failed to download file. Please try again.');
		}
	};
</script>

<div class="relative">
	<!-- Conditionally render either download or filter button -->
	<div class="absolute right-2 z-10">
		{#if showDownloadButton}
			<!-- Download Button -->
			<Button
				onclick={() => {
					downloadFile(downloadPath);
				}}
				aria-label="download button"
				class="flex cursor-pointer items-center justify-center  gap-2 "
			>
				<h2 class="text-[#0161DB]">Download</h2>
				<svg
					width="20"
					height="20"
					viewBox="0 0 20 20"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M16.648 2.9167C15.4887 1.75732 13.6226 1.75732 9.89072 1.75732C6.15877 1.75732 4.29279 1.75732 3.13343 2.9167C2.53375 3.51637 2.24425 4.3051 2.10449 5.44331C2.52461 4.9757 3.0294 4.58617 3.59623 4.29736C4.2149 3.98212 4.87737 3.85429 5.61086 3.79436C6.31951 3.73647 7.19146 3.73648 8.25764 3.73649H11.5238C12.59 3.73648 13.4619 3.73647 14.1706 3.79436C14.9041 3.85429 15.5666 3.98212 16.1852 4.29736C16.752 4.58617 17.2569 4.9757 17.6769 5.44331C17.5372 4.3051 17.2477 3.51637 16.648 2.9167Z"
						fill="#0161DB"
					/>
					<path
						fill-rule="evenodd"
						clip-rule="evenodd"
						d="M1.97461 11.2572C1.97461 9.04026 1.97461 7.93185 2.40604 7.08512C2.78554 6.34031 3.39109 5.73476 4.1359 5.35526C4.98263 4.92383 6.09107 4.92383 8.30794 4.92383H11.4746C13.6915 4.92383 14.7999 4.92383 15.6467 5.35526C16.3915 5.73476 16.997 6.34031 17.3765 7.08512C17.8079 7.93185 17.8079 9.04026 17.8079 11.2572C17.8079 13.4741 17.8079 14.5825 17.3765 15.4292C16.997 16.174 16.3915 16.7796 15.6467 17.159C14.7999 17.5905 13.6915 17.5905 11.4746 17.5905H8.30794C6.09107 17.5905 4.98263 17.5905 4.1359 17.159C3.39109 16.7796 2.78554 16.174 2.40604 15.4292C1.97461 14.5825 1.97461 13.4741 1.97461 11.2572ZM10.3111 14.052C10.1998 14.1634 10.0487 14.2259 9.89128 14.2259C9.73381 14.2259 9.58276 14.1634 9.47146 14.052L7.49227 12.0728C7.26039 11.8409 7.26039 11.4651 7.49227 11.2332C7.72414 11.0013 8.10008 11.0013 8.33193 11.2332L9.29753 12.1987V8.88216C9.29753 8.55425 9.56337 8.28841 9.89128 8.28841C10.2192 8.28841 10.485 8.55425 10.485 8.88216V12.1987L11.4506 11.2332C11.6825 11.0013 12.0584 11.0013 12.2903 11.2332C12.5221 11.4651 12.5221 11.8409 12.2903 12.0728L10.3111 14.052Z"
						fill="#0161DB"
					/>
				</svg>
			</Button>
		{:else}
			<!-- Filter Button -->
			<button
				id="filterDropdownButton"
				onclick={displayDropDown ? cancelFilter : openDropdown}
				class="hover:text-primary-700 flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200 md:w-auto dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700"
				type="button"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					aria-hidden="true"
					class="mr-2 h-4 w-4 text-gray-400"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
						clip-rule="evenodd"
					/>
				</svg>
				Filter
				<svg
					class="-mr-1 ml-1.5 h-5 w-5"
					fill="currentColor"
					viewBox="0 0 20 20"
					xmlns="http://www.w3.org/2000/svg"
					aria-hidden="true"
				>
					<path
						clip-rule="evenodd"
						fill-rule="evenodd"
						d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
					/>
				</svg>
			</button>
		{/if}
		{#if displayDropDown && !showDownloadButton}
			<div
				id="filterDropdown"
				class="absolute right-0 top-full z-10 h-[50vh] w-48 overflow-y-scroll rounded-lg bg-white p-3 shadow dark:bg-gray-700"
			>
				<h6 class="mb-3 text-sm font-medium text-gray-900 dark:text-white">Choose columns</h6>
				<ul class="space-y-2 text-sm" aria-labelledby="filterDropdownButton">
					{#each columns as column}
						<li class="flex items-center">
							<input
								id={column}
								type="checkbox"
								checked={tempSelectedColumns.includes(column)}
								onchange={() => toggleTempColumn(column)}
								class="text-primary-600 focus:ring-primary-500 dark:focus:ring-primary-600 h-4 w-4 rounded border-gray-300 bg-gray-100 focus:ring-2 dark:border-gray-500 dark:bg-gray-600 dark:ring-offset-gray-700"
							/>
							<label for={column} class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100"
								>{column}</label
							>
						</li>
					{/each}
				</ul>
				<div class="mt-3 flex space-x-2">
					<Button onclick={filterColumn} color="dark">Apply</Button>
					<Button onclick={cancelFilter} color="alternative">Cancel</Button>
				</div>
			</div>
		{/if}
	</div>

	<Table class="border-[1px] border-[#F5F5F5]">
		<TableHead defaultRow={false} class="bg-white">
			<tr>
				<TableHeadCell colspan={selectedColumns.length}
					>{file_name ? file_name : 'file.csv'}</TableHeadCell
				>
			</tr>
			<tr class="bg-[#F4F4F4]">
				{#each selectedColumns as column}
					<TableHeadCell>{column}</TableHeadCell>
				{/each}
			</tr>
		</TableHead>
		<TableBody tableBodyClass="divide-y">
			{#if data.length === 0}
				<TableBodyRow>
					<TableBodyCell colspan={selectedColumns.length} class="text-center text-gray-500">
						No transactions available.
					</TableBodyCell>
				</TableBodyRow>
			{:else}
				{#each data as transaction, index (`${transaction.transaction_id}-${index}`)}
					<TableBodyRow>
						{#each selectedColumns as column}
							<TableBodyCell>{transaction[column] ?? 'N/A'}</TableBodyCell>
						{/each}
					</TableBodyRow>
				{/each}
			{/if}
		</TableBody>
		<tfoot class="bg-[#F5F5F5]">
			<tr class="font-semibold text-gray-900 dark:text-white">
				<th scope="row" class="px-6 py-3 text-base" colspan={selectedColumns.length}
					>{`${data.length} Rows`}</th
				>
			</tr>
		</tfoot>
	</Table>
</div>

<script lang="ts">
	import { Card, Button, Dropzone } from 'flowbite-svelte';
	import { modal } from '../../store/toogleModal.svelte';
	import { user_id, VITE_API_URL } from '$lib/constants';
	import { goto } from '$app/navigation';

	let { fetchFiles = () => {}, files = [] } = $props();

	let uploadedFiles: File[] = $state([]);
	let disabledState: boolean = $state(true);
	let inputRef: any = $state();
	let isloading = $state(false);
	let project_name = $derived(fileName);
	let fileName = $state('');
	let fileExtension = $state('');
	let nameError = $state('');

	const dropHandle = (event) => {
		event.preventDefault();
		if (event.dataTransfer.items) {
			[...event.dataTransfer.items].forEach((item, i) => {
				if (item.kind === 'file') {
					const file = item.getAsFile();
					const nameParts = file.name.split('.');
					fileName = nameParts[0];
					fileExtension = nameParts[1];
				}
			});
		} else {
			[...event.dataTransfer.files].forEach((file, i) => {
				const nameParts = file.name.split('.');
				fileName = nameParts[0];
				fileExtension = nameParts[1];
			});
		}
	};

	const showFiles = (files) => {
		if (files.length === 1) return files[0].name;
		let concat = '';
		files.map((file) => {
			concat += file.name;
			concat += ', ';
		});

		if (concat.length > 40) concat = concat.slice(0, 40) + '...';
		return concat;
	};

	const handleChange = (event) => {
		uploadedFiles = event.target.files;
		if (uploadedFiles.length > 0) {
			const nameParts = uploadedFiles[0].name.split('.');
			fileName = nameParts[0];
			fileExtension = nameParts[1];
		}
	};

	const editProjectName = () => {
		disabledState = false;
		if (inputRef) {
			inputRef.focus();
			inputRef.setSelectionRange(0, fileName.length);
		}
	};

	const handleCreateProject = async () => {
		// Validate inputs
		if (uploadedFiles.length === 0 || !project_name) {
			alert('Please upload a file and provide a project name.');
			return;
		}

		// Validate file size before sending (100MB limit)
		const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes
		if (uploadedFiles[0].size > MAX_FILE_SIZE) {
			alert(
				`File is too large. Please upload a file smaller than ${MAX_FILE_SIZE / (1024 * 1024)}MB.`
			);
			return;
		}

		// Check for duplicate project name
		const trimmedProjectName = project_name.trim();
		if (files.some((file) => file.name.toLowerCase() === trimmedProjectName.toLowerCase())) {
			nameError = `A project named "${trimmedProjectName}" already exists. Please choose a different name.`;
			return;
		}

		try {
			// Set loading state
			isloading = true;
			nameError = ''; // Clear any previous name error

			// Prepare FormData
			const formdata = new FormData();
			formdata.append('file', uploadedFiles[0]);
			formdata.append('name', trimmedProjectName);
			formdata.append('user_id', user_id);

			// Make API request
			const response = await fetch(`${VITE_API_URL}/project/upload_dataset`, {
				method: 'POST',
				body: formdata
			});

			// Check if response is ok
			if (!response.ok) {
				let errorMessage = 'Failed to upload file.';
				if (response.status === 413) {
					errorMessage = 'File is too large. Please upload a smaller file or contact support.';
				} else {
					try {
						const err = await response.json();
						errorMessage = err.message || `HTTP error! Status: ${response.status}`;
					} catch (jsonError) {
						errorMessage = response.statusText || `HTTP error! Status: ${response.status}`;
					}
				}
				throw new Error(errorMessage);
			}

			// Parse successful response
			const data = await response.json();
			console.log('Uploaded data:', data);

			// Update local storage and UI
			localStorage.setItem('currentFile', trimmedProjectName);
			await fetchFiles();
			goto(`/DebtSheet/file_overview/${data.project_id}`);
			uploadedFiles = [];
			modal.isModalOpen = false;
		} catch (error) {
			// Log error for debugging
			console.error('Error uploading file:', error.message);

			// Show user-friendly error message
			alert(`Error uploading file: ${error.message}`);
		} finally {
			// Reset loading state
			isloading = false;
		}
	};
</script>

<Card
	class="relative flex max-w-[200px] min-w-[40%] flex-col gap-4 rounded-3xl border-none p-4 shadow-none"
>
	{#if isloading}
		<div class="absolute inset-0 z-30 flex h-full w-full items-center justify-center">
			<div
				class="z-40 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
			></div>
		</div>
	{/if}
	{#if uploadedFiles.length === 0}
		<span class="flex justify-between">
			<h3 class="text-lg font-semibold text-black">Upload File</h3>
			
			<button onclick={() => (modal.isModalOpen = false)} class=" cursor-pointer"
				><svg
					width="20"
					height="20"
					viewBox="0 0 20 20"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<rect width="20" height="20" rx="10" fill="white" />
					<path
						d="M9.57574 9.57574C9.34142 9.81005 9.34142 10.1899 9.57574 10.4243L13.3941 14.2426C13.6284 14.477 14.0083 14.477 14.2426 14.2426C14.477 14.0083 14.477 13.6284 14.2426 13.3941L10.8485 10L14.2426 6.60589C14.477 6.37157 14.477 5.99167 14.2426 5.75736C14.0083 5.52304 13.6284 5.52304 13.3941 5.75736L9.57574 9.57574ZM10.875 9.4H10V10.6H10.875V9.4Z"
						fill="black"
					/>
					<path
						d="M10.4243 9.57574C10.6586 9.81005 10.6586 10.1899 10.4243 10.4243L6.60589 14.2426C6.37157 14.477 5.99167 14.477 5.75736 14.2426C5.52304 14.0083 5.52304 13.6284 5.75736 13.3941L9.15147 10L5.75736 6.60589C5.52304 6.37157 5.52304 5.99167 5.75736 5.75736C5.99167 5.52304 6.37157 5.52304 6.60589 5.75736L10.4243 9.57574ZM9.125 9.4H10V10.6H9.125V9.4Z"
						fill="black"
					/>
				</svg>
			</button>
		</span>
		<p class="text-sm">
			Upload a CSV or XLSX file containing your trasaction data. make sure the format is per RBI
			Guidelines, You can download the sample file <a href="/" class="font-semibold text-[#0070FF]"
				>here</a
			>
		</p>
		<Dropzone
			id="dropzone"
			ondrop={dropHandle}
			ondragover={(event) => {
				event.preventDefault();
			}}
			onchange={handleChange}
			accept=".csv, .xls, .xlsx, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
			class="border-none bg-[#F0F7FF]"
		>
			<svg
				width="67"
				height="67"
				viewBox="0 0 67 67"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<mask
					id="mask0_2026_2015"
					style="mask-type:luminance"
					maskUnits="userSpaceOnUse"
					x="1"
					y="2"
					width="65"
					height="65"
				>
					<path d="M1.09082 2.63721H65.4108V66.9572H1.09082V2.63721Z" fill="white" />
				</mask>
				<g mask="url(#mask0_2026_2015)">
					<path
						d="M58.7113 66.9581H31.9113C28.2183 66.9581 25.2114 63.9512 25.2114 60.2581V49.5381C25.2114 48.7984 25.8117 48.1981 26.5514 48.1981C27.291 48.1981 27.8913 48.7984 27.8913 49.5381V60.2581C27.8913 62.4745 29.695 64.2781 31.9113 64.2781H58.7113C60.9277 64.2781 62.7313 62.4745 62.7313 60.2581V33.4581C62.7313 31.2418 60.9277 29.4381 58.7113 29.4381H45.3113C44.5717 29.4381 43.9713 28.8378 43.9713 28.0981C43.9713 27.3584 44.5717 26.7581 45.3113 26.7581H58.7113C62.4044 26.7581 65.4113 29.7651 65.4113 33.4581V60.2581C65.4113 63.9512 62.4044 66.9581 58.7113 66.9581Z"
						fill="#6785A8"
						fill-opacity="0.62"
					/>
					<path
						d="M21.1917 42.8382H19.8517C19.112 42.8382 18.5117 42.2379 18.5117 41.4982C18.5117 40.7585 19.112 40.1582 19.8517 40.1582H21.1917C21.9314 40.1582 22.5317 40.7585 22.5317 41.4982C22.5317 42.2379 21.9314 42.8382 21.1917 42.8382Z"
						fill="#A1B1C4"
					/>
					<path
						d="M14.4355 42.8385H11.726C10.9864 42.8385 10.386 42.2382 10.386 41.4985C10.386 40.7588 10.9864 40.1585 11.726 40.1585H14.4355C15.1752 40.1585 15.7755 40.7588 15.7755 41.4985C15.7755 42.2382 15.1752 42.8385 14.4355 42.8385ZM6.32853 42.6348C6.20793 42.6348 6.08465 42.6187 5.96137 42.5839C4.87597 42.2757 3.87633 41.6915 3.07232 40.8901C2.54704 40.3702 2.54436 39.5207 3.06697 38.9954C3.58957 38.4728 4.43913 38.4674 4.96173 38.99C5.44413 39.4697 6.04445 39.8208 6.69301 40.0057C7.40589 40.2067 7.81861 40.9491 7.61493 41.662C7.44877 42.2516 6.91009 42.6348 6.32853 42.6348ZM2.4318 36.2913C1.69212 36.2913 1.0918 35.6909 1.0918 34.9513V32.2418C1.0918 31.5021 1.69212 30.9018 2.4318 30.9018C3.17149 30.9018 3.77181 31.5021 3.77181 32.2418V34.9513C3.77181 35.6909 3.17149 36.2913 2.4318 36.2913ZM2.4318 28.1628C1.69212 28.1628 1.0918 27.5625 1.0918 26.8228V24.1133C1.0918 23.3736 1.69212 22.7733 2.4318 22.7733C3.17149 22.7733 3.77181 23.3736 3.77181 24.1133V26.8228C3.77181 27.5625 3.17149 28.1628 2.4318 28.1628ZM2.4318 20.037C1.69212 20.037 1.0918 19.4367 1.0918 18.697V15.9875C1.0918 15.2478 1.69212 14.6475 2.4318 14.6475C3.17149 14.6475 3.77181 15.2478 3.77181 15.9875V18.697C3.77181 19.4367 3.17149 20.037 2.4318 20.037ZM39.9517 17.2739C39.2121 17.2739 38.6117 16.6736 38.6117 15.9339V13.2244C38.6117 12.4848 39.2121 11.8844 39.9517 11.8844C40.6914 11.8844 41.2917 12.4821 41.2917 13.2244V15.9339C41.2917 16.6736 40.6914 17.2739 39.9517 17.2739ZM2.4318 11.9086C1.69212 11.9086 1.0918 11.3082 1.0918 10.5686V9.33844C1.0918 8.72201 1.17756 8.10832 1.34372 7.51604C1.54472 6.80048 2.28976 6.37972 2.99729 6.59144C3.71017 6.79244 4.12289 7.53209 3.92189 8.245C3.82273 8.59873 3.77181 8.96592 3.77181 9.33844V10.5686C3.77181 11.3082 3.17149 11.9086 2.4318 11.9086ZM39.7346 9.16692C39.1531 9.16692 38.6198 8.78633 38.4482 8.20209C38.2607 7.55624 37.9015 6.96125 37.4191 6.47885C36.8938 5.95893 36.8885 5.10937 37.4084 4.58412C37.9283 4.05616 38.7779 4.05345 39.3032 4.5734C40.1099 5.37201 40.7048 6.36629 41.021 7.44901C41.2301 8.15921 40.82 8.90157 40.1098 9.11061C39.9839 9.15084 39.8579 9.16692 39.7346 9.16692ZM6.28565 5.53284C5.70677 5.53284 5.17077 5.15496 4.99925 4.57072C4.79289 3.86052 5.20025 3.11548 5.91045 2.90644C6.51881 2.72956 7.15129 2.63843 7.79181 2.63843H8.97369C9.71337 2.63843 10.3137 3.23876 10.3137 3.97844C10.3137 4.71812 9.71605 5.31844 8.97369 5.31844H7.79181C7.40589 5.31844 7.02801 5.37201 6.66353 5.47921C6.53757 5.51676 6.41161 5.53284 6.28565 5.53284ZM33.3563 5.31844H30.6468C29.9071 5.31844 29.3068 4.71812 29.3068 3.97844C29.3068 3.23876 29.9071 2.63843 30.6468 2.63843H33.3563C34.0959 2.63843 34.6963 3.23876 34.6963 3.97844C34.6963 4.71812 34.0959 5.31844 33.3563 5.31844ZM25.2279 5.31844H22.5211C21.7814 5.31844 21.1811 4.71812 21.1811 3.97844C21.1811 3.23876 21.7787 2.63843 22.5211 2.63843H25.2306C25.9702 2.63843 26.5706 3.23876 26.5706 3.97844C26.5706 4.71812 25.9702 5.31844 25.2279 5.31844ZM17.1021 5.31844H14.3926C13.653 5.31844 13.0526 4.71812 13.0526 3.97844C13.0526 3.23876 13.653 2.63843 14.3926 2.63843H17.1021C17.8418 2.63843 18.4421 3.23876 18.4421 3.97844C18.4421 4.71812 17.8418 5.31844 17.1021 5.31844Z"
						fill="#C3D4E8"
					/>
					<path
						d="M39.9513 24.0781C39.2116 24.0781 38.6113 23.4778 38.6113 22.7381V21.3981C38.6113 20.6584 39.2116 20.0581 39.9513 20.0581C40.691 20.0581 41.2913 20.6584 41.2913 21.3981V22.7381C41.2913 23.4778 40.691 24.0781 39.9513 24.0781Z"
						fill="#A1B1C4"
					/>
					<path
						d="M34.7258 50.8782H29.2318C25.5388 50.8782 22.5318 47.8713 22.5318 44.1782V39.373L21.3312 38.1724C20.5406 37.3844 20.1064 36.3312 20.1064 35.2136C20.1064 34.0961 20.5406 33.0455 21.3312 32.2549C21.9851 31.601 22.8186 31.191 23.7218 31.0677C23.6414 29.9019 24.046 28.7093 24.9358 27.8195C25.8658 26.8896 27.2003 26.4553 28.4787 26.6349C28.6314 25.8416 29.012 25.0832 29.6257 24.4694C30.7513 23.3438 32.4987 22.966 33.9593 23.4752C34.1549 22.8588 34.498 22.2772 34.9857 21.7894C36.6152 20.16 39.271 20.16 40.9005 21.7894L45.0545 25.9435C47.8122 28.7039 49.3318 32.3728 49.3318 36.2722C49.3318 44.3256 42.7792 50.8782 34.7258 50.8782ZM25.2118 42.053V44.1782C25.2118 46.3946 27.0154 48.1982 29.2318 48.1982H34.7258C41.3025 48.1982 46.6518 42.849 46.6518 36.2722C46.6518 33.0884 45.4109 30.0922 43.1597 27.841L39.0057 23.6869C38.4188 23.1 37.4674 23.1 36.8805 23.6869C36.5964 23.9683 36.4383 24.3462 36.4383 24.7482C36.4383 25.1502 36.5937 25.5281 36.8778 25.8094C37.1404 26.0721 37.2718 26.4151 37.2718 26.7582C37.2718 27.1013 37.1404 27.4443 36.8805 27.707C36.3579 28.2296 35.5083 28.2296 34.9857 27.707L33.6457 26.3669C33.0776 25.7987 32.0886 25.7987 31.5205 26.3669C30.9336 26.9539 30.9336 27.9053 31.5205 28.4922L32.8605 29.8322C33.1204 30.0922 33.2518 30.4352 33.2518 30.7782C33.2518 31.1213 33.1204 31.4643 32.8605 31.727C32.3379 32.2496 31.4883 32.2496 30.9657 31.727L28.9557 29.717C28.3876 29.1488 27.3986 29.1488 26.8305 29.717C26.2436 30.3039 26.2436 31.2553 26.8305 31.8422L30.1805 35.1922C30.4404 35.4522 30.5718 35.7952 30.5718 36.1382C30.5718 36.4813 30.4404 36.8243 30.1805 37.087C29.6579 37.6096 28.8083 37.6096 28.2857 37.087L25.3512 34.1524C24.783 33.5842 23.7941 33.5842 23.226 34.1524C22.9419 34.4364 22.7864 34.8143 22.7864 35.2136C22.7864 35.613 22.9419 35.9935 23.226 36.2749L30.1805 43.2295C30.4404 43.4922 30.5718 43.8352 30.5718 44.1782C30.5718 44.5213 30.4404 44.8643 30.1805 45.127C29.6579 45.6496 28.8083 45.6496 28.2857 45.127L25.2118 42.053Z"
						fill="#6785A8"
						fill-opacity="0.62"
					/>
				</g>
			</svg>
			<br />
			{#if uploadedFiles.length === 0}
				<p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
					<span class="font-semibold">Drag and Drop your files or simply click here</span>
				</p>
			{:else}
				<p>{showFiles(uploadedFiles)}</p>
			{/if}
		</Dropzone>
	{:else}<div class="">
			<span class="flex justify-between">
				<h3 class="text-lg font-semibold text-black">File Uploaded Successfully</h3>
				<!-- svelte-ignore a11y_consider_explicit_label -->
				<button onclick={() => (modal.isModalOpen = false)} class=" cursor-pointer"
					><svg
						width="20"
						height="20"
						viewBox="0 0 20 20"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<rect width="20" height="20" rx="10" fill="white" />
						<path
							d="M9.57574 9.57574C9.34142 9.81005 9.34142 10.1899 9.57574 10.4243L13.3941 14.2426C13.6284 14.477 14.0083 14.477 14.2426 14.2426C14.477 14.0083 14.477 13.6284 14.2426 13.3941L10.8485 10L14.2426 6.60589C14.477 6.37157 14.477 5.99167 14.2426 5.75736C14.0083 5.52304 13.6284 5.52304 13.3941 5.75736L9.57574 9.57574ZM10.875 9.4H10V10.6H10.875V9.4Z"
							fill="black"
						/>
						<path
							d="M10.4243 9.57574C10.6586 9.81005 10.6586 10.1899 10.4243 10.4243L6.60589 14.2426C6.37157 14.477 5.99167 14.477 5.75736 14.2426C5.52304 14.0083 5.52304 13.6284 5.75736 13.3941L9.15147 10L5.75736 6.60589C5.52304 6.37157 5.52304 5.99167 5.75736 5.75736C5.99167 5.52304 6.37157 5.52304 6.60589 5.75736L10.4243 9.57574ZM9.125 9.4H10V10.6H9.125V9.4Z"
							fill="black"
						/>
					</svg>
				</button></span
			>
			<p class=" text-[.8em]">
				Your transaction sheet has been uploaded and will be processed for further fixes.
			</p>
		</div>
		<div class="flex flex-col gap-4">
			<h3 class="text-md font-semibold text-black">Project Name</h3>
			{#if nameError}
				<div class="mb-2 rounded bg-red-100 p-2 text-sm text-red-500">
					{nameError}
				</div>
			{/if}
			<div class="flex items-center justify-between rounded-xl bg-[#F8F8F8] p-2">
				<span class="flex w-[90%] items-center">
					<img src="/excel.png" width="50" alt="" /><input
						type="text"
						bind:value={project_name}
						bind:this={inputRef}
						disabled={disabledState}
						class="w-full border-none bg-transparent"
						placeholder="Enter project name"
					/>
				</span>
				<span
					class="cursor-pointer"
					tabindex="0"
					role="button"
					onclick={() => editProjectName()}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							editProjectName();
						}
					}}
					><svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M5 19H6.425L16.2 9.225L14.775 7.8L5 17.575V19ZM3 21V16.75L16.2 3.575C16.4 3.39167 16.6208 3.25 16.8625 3.15C17.1042 3.05 17.3583 3 17.625 3C17.8917 3 18.15 3.05 18.4 3.15C18.65 3.25 18.8667 3.4 19.05 3.6L20.425 5C20.625 5.18333 20.7708 5.4 20.8625 5.65C20.9542 5.9 21 6.15 21 6.4C21 6.66667 20.9542 6.92083 20.8625 7.1625C20.7708 7.40417 20.625 7.625 20.425 7.825L7.25 21H3ZM15.475 8.525L14.775 7.8L16.2 9.225L15.475 8.525Z"
							fill="black"
							fill-opacity="0.2"
						/>
					</svg>
				</span>
			</div>
		</div>
		<div class="button-group flex items-center justify-center gap-2">
			<Button color="dark" class="cursor-pointer" onclick={() => handleCreateProject()}>
				Create Project
			</Button>
			<Button color="alternative" class="hover:text-black" onclick={() => (uploadedFiles = [])}>
				Reupload
			</Button>
		</div>
	{/if}
</Card>

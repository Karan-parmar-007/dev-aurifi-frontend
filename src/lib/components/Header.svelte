<script>
	import { Navbar, NavBrand, NavHamburger, Button, Modal } from 'flowbite-svelte';
	import { modal, SideBar } from '../../store/toogleModal.svelte';
	import { page } from '$app/stores';

	let pathUrl = $state($page.url.pathname);
	let urlParts = $state(pathUrl.split('/'));

	// Determine active path
	let isHomeActive = $state(pathUrl === '/');
	let isArchiveActive = $state(pathUrl.startsWith('/DebtSheet/Archive'));
</script>

<div class="absolute w-full px-8 py-4">
	<Navbar>
		<NavBrand class="flex gap-4 px-6" href="/">
			<button aria-label="sidebar button" on:click={() => (SideBar.isSideBarVisible = false)}>
				<svg
					class="h-6 w-6 text-gray-800 dark:text-white"
					aria-hidden="true"
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					fill="none"
					viewBox="0 0 24 24"
				>
					<path
						stroke="currentColor"
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="m7 10 1.99994 1.9999-1.99994 2M12 5v14M5 4h14c.5523 0 1 .44772 1 1v14c0 .5523-.4477 1-1 1H5c-.55228 0-1-.4477-1-1V5c0-.55228.44772-1 1-1Z"
					/>
				</svg>
			</button>

			<a href="/">
				<h1
					class="text-2xl font-bold"
					class:text-black={isHomeActive}
					class:text-[#0000005e]={!isHomeActive}
				>
					Book Debt Management
				</h1>
			</a>
			<a href="/DebtSheet/Archive">
				<h1
					class="text-2xl font-bold"
					class:text-black={isArchiveActive}
					class:text-[#0000005e]={!isArchiveActive}
				>
					Archive
				</h1>
			</a>
		</NavBrand>
		<div class="flex gap-4 md:order-2">
			<NavHamburger />
			<Button
				color="light"
				class="text-primaryBlue-100 cursor-pointer gap-2 rounded-xl border-none bg-[#F0F7FF] hover:bg-[#dfecfc]"
			>
				<svg
					width="23"
					height="23"
					viewBox="0 0 23 23"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M19.679 3.3202C18.2756 1.91675 16.0168 1.91675 11.4992 1.91675C6.98154 1.91675 4.72273 1.91675 3.31929 3.3202C2.59336 4.04612 2.24291 5.0009 2.07373 6.37873C2.58229 5.81268 3.19335 5.34114 3.87952 4.99152C4.62844 4.60992 5.43037 4.45518 6.31828 4.38264C7.17612 4.31255 8.23164 4.31256 9.52228 4.31258H13.476C14.7667 4.31256 15.8222 4.31255 16.68 4.38264C17.568 4.45518 18.3699 4.60992 19.1188 4.99152C19.8049 5.34114 20.4161 5.81268 20.9246 6.37873C20.7554 5.0009 20.405 4.04612 19.679 3.3202Z"
						fill="url(#paint0_linear_2026_2000)"
					/>
					<path
						fill-rule="evenodd"
						clip-rule="evenodd"
						d="M1.9165 13.4167C1.9165 10.733 1.9165 9.39129 2.43877 8.3663C2.89815 7.46469 3.63119 6.73165 4.5328 6.27226C5.5578 5.75 6.89959 5.75 9.58317 5.75H13.4165C16.1001 5.75 17.4419 5.75 18.4669 6.27226C19.3685 6.73165 20.1016 7.46469 20.5609 8.3663C21.0832 9.39129 21.0832 10.733 21.0832 13.4167C21.0832 16.1003 21.0832 17.4421 20.5609 18.4671C20.1016 19.3687 19.3685 20.1017 18.4669 20.561C17.4419 21.0833 16.1001 21.0833 13.4165 21.0833H9.58317C6.89959 21.0833 5.5578 21.0833 4.5328 20.561C3.63119 20.1017 2.89815 19.3687 2.43877 18.4671C1.9165 17.4421 1.9165 16.1003 1.9165 13.4167ZM12.008 16.7999C11.8733 16.9347 11.6904 17.0104 11.4998 17.0104C11.3092 17.0104 11.1264 16.9347 10.9916 16.7999L8.59577 14.404C8.31509 14.1233 8.31509 13.6683 8.59577 13.3876C8.87646 13.1069 9.33155 13.1069 9.61221 13.3876L10.7811 14.5564V10.5417C10.7811 10.1447 11.1029 9.82292 11.4998 9.82292C11.8968 9.82292 12.2186 10.1447 12.2186 10.5417V14.5564L13.3875 13.3876C13.6682 13.1069 14.1232 13.1069 14.4039 13.3876C14.6846 13.6683 14.6846 14.1233 14.4039 14.404L12.008 16.7999Z"
						fill="url(#paint1_linear_2026_2000)"
					/>
					<defs>
						<linearGradient
							id="paint0_linear_2026_2000"
							x1="15.9417"
							y1="16.6661"
							x2="11.8024"
							y2="1.98359"
							gradientUnits="userSpaceOnUse"
						>
							<stop stop-color="#0070FF" />
							<stop offset="1" stop-color="#015ED4" />
						</linearGradient>
						<linearGradient
							id="paint1_linear_2026_2000"
							x1="16.0168"
							y1="56.4352"
							x2="-11.1843"
							y2="27.888"
							gradientUnits="userSpaceOnUse"
						>
							<stop stop-color="#0070FF" />
							<stop offset="1" stop-color="#015ED4" />
						</linearGradient>
					</defs>
				</svg>
				Download Sample File
			</Button>
			<Button
				color="dark"
				class="cursor-not-allowed rounded-xl bg-[#91959e] text-white hover:bg-[#91959e]"
				disabled
			>
				+ Import from LMS
			</Button>
			<Button
				color="dark"
				class="bg-dark-100 cursor-pointer rounded-xl text-white"
				onclick={() => (modal.isModalOpen = true)}
			>
				+ Upload debt sheet
			</Button>
		</div>
	</Navbar>
</div>

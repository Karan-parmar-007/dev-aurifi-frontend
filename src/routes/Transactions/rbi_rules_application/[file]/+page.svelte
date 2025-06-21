<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import BreadCrumb from '$lib/components/BreadCrumb.svelte';
	import {
		Button,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	let isloading = $state(false);
	let path = page.url.pathname;
	let urlParts = path.split('/');
	let project_id = urlParts[3];
	let currentFile = $state('');

	onMount(() => {
		if (browser) {
			currentFile = localStorage.getItem('currentFile') || 'No file selected';
		}
	});
</script>

<div class="flex h-[100vh] w-full flex-col">
	<div class="flex w-full items-center gap-4 px-16 pt-14">
		<svg width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M20.4338 8.69904C20.4333 8.69858 20.4329 8.69812 20.4324 8.69766L11.866 0.539551C11.5009 0.19165 11.0154 0 10.4991 0C9.98268 0 9.49722 0.191498 9.13193 0.539398L0.570075 8.69339C0.567191 8.69614 0.564307 8.69904 0.561423 8.70178C-0.188394 9.42001 -0.187112 10.5853 0.565108 11.3017C0.908774 11.6292 1.36267 11.8188 1.84797 11.8387C1.86767 11.8405 1.88754 11.8414 1.90757 11.8414H2.24899V17.8453C2.24899 19.0334 3.26397 20 4.51174 20H7.86317C8.20283 20 8.4784 19.7377 8.4784 19.4141V14.707C8.4784 14.1649 8.94143 13.7239 9.51068 13.7239H11.4874C12.0567 13.7239 12.5197 14.1649 12.5197 14.707V19.4141C12.5197 19.7377 12.7951 20 13.135 20H16.4864C17.7342 20 18.7491 19.0334 18.7491 17.8453V11.8414H19.0657C19.5819 11.8414 20.0674 11.6499 20.4329 11.302C21.1859 10.5844 21.1862 9.41711 20.4338 8.69904Z"
				fill="#242C3E"
			/>
		</svg>
		<h1 class="text-xl font-semibold">{currentFile}</h1>
	</div>

	<div class="h-full px-20">
		<BreadCrumb />
		<div class="flex h-full flex-col gap-2 px-4 py-6">
			<h2 class="font-semibold">Applying RBI Rules 1/5</h2>
			{#if isloading}
				<p>loading ...</p>
			{:else}
				<div class="flex flex-1 flex-col gap-4 py-4">
					<Table>
						<TableHead>
							<TableHeadCell>Rules</TableHeadCell>
							<TableHeadCell>Accepted Entries</TableHeadCell>
							<TableHeadCell>Rejected Entries</TableHeadCell>
							<TableHeadCell></TableHeadCell>
						</TableHead>
						<TableBody>
							<TableBodyRow>
								<TableBodyCell
									><span class="flex flex-col justify-center">
										<h3 class=" font-semibold text-black">RBI Rule 1</h3>
										<h3 class=" font-medium text-[#7C7C7C]">No Duplicates</h3>
									</span></TableBodyCell
								>
								<TableBodyCell
									><span class="flex flex-col justify-center">
										<h3 class="font-semibold text-[#04940E]">4000 Loans</h3>
										<h3 class="font-semibold">114,10,42,637/-</h3>
									</span></TableBodyCell
								>
								<TableBodyCell
									><span class="flex flex-col justify-center">
										<h3 class=" font-semibold text-[#04940E]">40 Loans</h3>
										<h3 class="font-semibold">10,42,637/-</h3>
									</span></TableBodyCell
								>
								<TableBodyCell>
									<span class="flex items-center gap-2"
										><svg
											width="10"
											height="10"
											viewBox="0 0 10 10"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<g clip-path="url(#clip0_115_2038)">
												<path
													d="M9.69667 3.35068L4.41087 8.6365C4.21863 8.82919 3.95805 8.93814 3.68587 8.93965C3.68343 8.93965 3.68101 8.9398 3.67859 8.9398C3.67616 8.9398 3.67372 8.93966 3.6713 8.93963C3.64827 8.93947 3.62526 8.93842 3.60228 8.93672C3.58405 8.93541 3.56582 8.9336 3.54759 8.93127C3.52526 8.92843 3.50296 8.92513 3.48081 8.92086C3.47886 8.92047 3.47691 8.91996 3.47495 8.91959C3.45208 8.91502 3.42941 8.90951 3.40683 8.9034C3.38456 8.89736 3.36243 8.89078 3.34052 8.88322C3.33901 8.88269 3.33749 8.88228 3.33599 8.88175C3.33296 8.8807 3.32997 8.87945 3.32696 8.87836C3.28237 8.86237 3.23894 8.84331 3.19698 8.82132C3.17595 8.81027 3.15532 8.79816 3.13491 8.78554C3.09659 8.76199 3.05986 8.73594 3.02495 8.70757C3.0114 8.69652 2.99806 8.68507 2.98493 8.67322C2.97181 8.66137 2.95893 8.64913 2.9463 8.6365L0.303311 5.99361C0.109103 5.7994 -1.83139e-06 5.53599 0 5.26134C1.83143e-06 4.98668 0.10911 4.72328 0.303321 4.52907C0.497533 4.33486 0.760939 4.22576 1.03559 4.22576C1.31025 4.22576 1.57365 4.33487 1.76786 4.52908L3.67853 6.43972L8.23212 1.88611C8.32818 1.78947 8.44237 1.71273 8.56814 1.6603C8.69391 1.60787 8.82879 1.58077 8.96505 1.58057C9.10132 1.58036 9.23628 1.60705 9.36221 1.6591C9.48814 1.71115 9.60256 1.78754 9.69891 1.88389C9.79526 1.98025 9.87165 2.09467 9.9237 2.2206C9.97575 2.34653 10.0024 2.48149 10.0022 2.61775C10.002 2.75401 9.97492 2.88889 9.92249 3.01467C9.87005 3.14044 9.79332 3.25462 9.69667 3.35068Z"
													fill="#109135"
												/>
											</g>
											<defs>
												<clipPath id="clip0_115_2038">
													<rect width="10" height="10" fill="white" />
												</clipPath>
											</defs>
										</svg>
										<h2 class="font-semibold text-[#109135]">Completed</h2></span
									>
								</TableBodyCell>
							</TableBodyRow>
							<TableBodyRow class="bg-gray-100">
								<TableBodyCell
									><span class="flex flex-col justify-center">
										<h3 class=" font-semibold text-black">RBI Rule 2</h3>
										<h3 class=" font-medium text-[#7C7C7C]">No Duplicates</h3>
									</span></TableBodyCell
								>
								<TableBodyCell
									><span class="flex flex-col justify-center">
										<h3 class=" font-semibold text-[#04940E]">2332 Loans</h3>
										<h3 class="font-semibold">114,10,42,637/-</h3>
									</span></TableBodyCell
								>
								<TableBodyCell
									><span class="flex flex-col justify-center">
										<h3 class=" font-semibold text-[#04940E]">20 Loans</h3>
										<h3 class="font-semibold">10,42,637/-</h3>
									</span></TableBodyCell
								>
								<TableBodyCell>
									<span class="flex items-center gap-2">
										<h2 class="font-semibold text-[#0171DB]">In Progress (83%)</h2></span
									>
								</TableBodyCell>
							</TableBodyRow>
							<TableBodyRow>
								<TableBodyCell
									><span class="flex flex-col justify-center">
										<h3 class=" font-semibold text-black">RBI Rule 3</h3>
										<!-- <h3 class=" font-medium text-[#7C7C7C]">No Duplicates</h3> -->
									</span></TableBodyCell
								>
								<TableBodyCell></TableBodyCell>
								<TableBodyCell></TableBodyCell>
								<TableBodyCell>
									<span class="flex items-center gap-2">
										<h2 class="font-semibold text-[#C2C2C2]">Not Yet Started</h2></span
									>
								</TableBodyCell>
							</TableBodyRow>
							<TableBodyRow>
								<TableBodyCell
									><span class="flex flex-col justify-center">
										<h3 class=" font-semibold text-black">RBI Rule 4</h3>
										<!-- <h3 class=" font-medium text-[#7C7C7C]">No Duplicates</h3> -->
									</span></TableBodyCell
								>
								<TableBodyCell></TableBodyCell>
								<TableBodyCell></TableBodyCell>
								<TableBodyCell>
									<span class="flex items-center gap-2">
										<h2 class="font-semibold text-[#C2C2C2]">Not Yet Started</h2></span
									>
								</TableBodyCell>
							</TableBodyRow>
							<TableBodyRow class="hidden bg-[#F7FBFE]">
								<TableBodyCell
									><h2 class="font-semibold text-[#0161DB]">Final File</h2></TableBodyCell
								>
								<TableBodyCell></TableBodyCell>
								<TableBodyCell></TableBodyCell>
								<TableBodyCell
									><button class="flex cursor-pointer gap-2"
										><h2 class="text-[#0161DB]">Download</h2>
										<svg
											width="17"
											height="17"
											viewBox="0 0 17 17"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												d="M15.6451 1.87324C14.4857 0.713867 12.6197 0.713867 8.88779 0.713867C5.15584 0.713867 3.28986 0.713867 2.1305 1.87324C1.53082 2.47291 1.24132 3.26164 1.10156 4.39985C1.52168 3.93225 2.02647 3.54271 2.5933 3.2539C3.21197 2.93866 3.87444 2.81083 4.60793 2.75091C5.31658 2.69301 6.18854 2.69302 7.25471 2.69303H10.5208C11.5871 2.69302 12.459 2.69301 13.1676 2.75091C13.9012 2.81083 14.5636 2.93866 15.1823 3.2539C15.7491 3.54271 16.2539 3.93225 16.674 4.39985C16.5343 3.26164 16.2448 2.47291 15.6451 1.87324Z"
												fill="#0161DB"
											/>
											<path
												fill-rule="evenodd"
												clip-rule="evenodd"
												d="M0.972656 10.2137C0.972656 7.9968 0.972656 6.8884 1.40409 6.04166C1.78358 5.29685 2.38914 4.6913 3.13395 4.31181C3.98068 3.88037 5.08912 3.88037 7.30599 3.88037H10.4727C12.6896 3.88037 13.798 3.88037 14.6447 4.31181C15.3895 4.6913 15.9951 5.29685 16.3745 6.04166C16.806 6.8884 16.806 7.9968 16.806 10.2137C16.806 12.4306 16.806 13.539 16.3745 14.3858C15.9951 15.1306 15.3895 15.7361 14.6447 16.1156C13.798 16.547 12.6896 16.547 10.4727 16.547H7.30599C5.08912 16.547 3.98068 16.547 3.13395 16.1156C2.38914 15.7361 1.78358 15.1306 1.40409 14.3858C0.972656 13.539 0.972656 12.4306 0.972656 10.2137ZM9.30914 13.0085C9.19784 13.1199 9.04679 13.1825 8.88932 13.1825C8.73186 13.1825 8.58081 13.1199 8.4695 13.0085L6.49031 11.0294C6.25844 10.7975 6.25844 10.4216 6.49031 10.1897C6.72218 9.95784 7.09813 9.95784 7.32998 10.1897L8.29557 11.1552V7.8387C8.29557 7.5108 8.56141 7.24495 8.88932 7.24495C9.21723 7.24495 9.48307 7.5108 9.48307 7.8387V11.1552L10.4487 10.1897C10.6805 9.95784 11.0564 9.95784 11.2883 10.1897C11.5202 10.4216 11.5202 10.7975 11.2883 11.0294L9.30914 13.0085Z"
												fill="#0161DB"
											/>
										</svg></button
									>
								</TableBodyCell>
							</TableBodyRow>
						</TableBody>
					</Table>

					<Button
						color="dark"
						class="mt-20 h-[38px] w-[144px]"
						onclick={() => goto(`/Transactions/sanitised_data/${project_id}`)}>Continue</Button
					>
				</div>
			{/if}
		</div>
	</div>
</div>

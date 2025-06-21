<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Dropdown, DropdownItem, Button } from 'flowbite-svelte';
	import {
		addUsersModal,
		systemColumnModal,
		assetClassModal,
		TransactionsystemColumnModal
	} from '../../store/toogleModal.svelte';

	const urlParts = $derived(page.url.pathname.split('/'));
	let componentSelection = $derived(urlParts[2]);
	let activeUrl = $derived(urlParts[2]);
</script>

<div class="w-full bg-[#202020]">
	<nav class="flex h-[70px] w-full items-center justify-between overflow-hidden px-6">
		<span class="logo overflow-hidden">
			<img src="/aurifi_logo.png" alt="aurifi logo" width="90" height="40" />
		</span>
		<span class="flex items-center justify-between gap-6 text-white">
			<button
				class="cursor-pointer"
				onclick={() => {
					componentSelection = 'UserSettings';
					goto('/admin/user_settings');
				}}
			>
				User Settings
			</button>
			<button class="cursor-pointer">System Columns</button>
			<Dropdown {activeUrl} activeClass="bg-[#242C3E33] rounded-xl mx-1 my-1" class="w-40">
				<DropdownItem
					class="mx-1 rounded-xl hover:bg-gray-200"
					onclick={() => (componentSelection = 'DebtSheet')}
					href="/admin/DebtSheet"
				>
					DebtSheet
				</DropdownItem>
				<DropdownItem
					class="mx-1 rounded-xl hover:bg-gray-200"
					onclick={() => (componentSelection = 'Transactions')}
					href="/admin/Transactions"
				>
					Transactions
				</DropdownItem>
				<DropdownItem
					class="mx-1 rounded-xl hover:bg-gray-200"
					onclick={() => (componentSelection = 'AssetClass')}
					href="/admin/AssetClass"
				>
					Asset Class
				</DropdownItem>
			</Dropdown>
		</span>
	</nav>
</div>
{#if urlParts[2] === 'DebtSheet'}
	<div class="mt-20 flex w-full flex-col px-20">
		<div class="text-[11px] font-semibold text-[#A1A1A1]">System Column</div>
		<div class="flex items-center justify-between">
			<h2 class="text-3xl font-semibold">Book Debt</h2>
			<Button
				color="dark"
				class="text-nowrap"
				onclick={() => {
					systemColumnModal.isSystemColumnModalOpen = true;
				}}
			>
				+ Add Columns
			</Button>
		</div>
	</div>
{:else if urlParts[2] === 'Transactions'}
	<div class="mt-20 flex w-full flex-col px-20">
		<div class="text-[11px] font-semibold text-[#A1A1A1]">System Column</div>
		<div class="flex items-center justify-between">
			<h2 class="text-3xl font-semibold">Transaction</h2>
			<Button
				color="dark"
				class="text-nowrap"
				onclick={() => {
					TransactionsystemColumnModal.isTransactionSystemColumnModalOpen = true;
				}}
			>
				+ Add Columns
			</Button>
		</div>
	</div>
{:else if urlParts[2] === 'AssetClass'}
	<div class="mt-20 flex w-full flex-col px-20">
		<div class="flex items-center justify-between">
			<h2 class="text-3xl font-semibold">Asset Class</h2>
			<Button
				color="dark"
				class="text-nowrap"
				onclick={() => {
					assetClassModal.isAssetClassModalOpen = true;
				}}
			>
				+ Add Class
			</Button>
		</div>
	</div>
{:else if urlParts[2] === 'UserSettings'}
	<div class="mt-20 flex w-full flex-col px-20">
		<div class="text-[11px] font-semibold text-[#A1A1A1]">User Settings</div>
		<div class="flex items-center justify-between">
			<h2 class="text-3xl font-semibold">Current Users</h2>
			<Button
				color="dark"
				class="text-nowrap"
				onclick={() => {
					addUsersModal.isAddUsersModalOpen = true;
				}}
			>
				+ Add Users
			</Button>
		</div>
	</div>
{:else}
	<div></div>
{/if}

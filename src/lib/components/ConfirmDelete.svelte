<script lang="ts">
	import { Modal } from 'flowbite-svelte';
	import { deleteModal } from '../../store/toogleModal.svelte';

	let { deleteIndex = $bindable() } = $props();
</script>

<Modal bind:open={deleteModal.isDeleteModalOpen} title="Confirm Delete" classHeader="text-black">
	<h2 class="">Are you sure you want to delete rule {deleteIndex + 1}?</h2>
	<div class="flex w-full items-center justify-end gap-4">
		<button
			class="text-gary-200 rounded px-4 py-2 cursor-pointer"
			onclick={() => {
				// Call the actual delete function here
				deleteModal.onConfirmDelete?.(deleteIndex);
				deleteModal.isDeleteModalOpen = false;
			}}
		>
			Yes, Delete
		</button>
		<button
			class="rounded px-4 py-2 text-[#0161DB] cursor-pointer"
			onclick={() => {
				deleteModal.isDeleteModalOpen = false;
			}}
		>
			No
		</button>
	</div>
</Modal>

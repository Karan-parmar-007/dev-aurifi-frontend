<!-- src/lib/components/TagInput.svelte -->
<script lang="ts">
	// Define props with optional default values
	interface Tag {
		id: string;
		text: string;
	}

	interface Props {
		tags?: Tag[];
		placeholder?: string;
		onTagsChange?: (tags: Tag[]) => void;
		name?: string; // Add name prop for form integration
		required?: boolean; // Add required prop for validation
	}

	let props: Props = $props();

	// Create state variables properly
	let tags = $state(props.tags || []);
	let placeholder = $state(props.placeholder || '');
	let onTagsChange = props.onTagsChange;
	let name = props.name || 'tags';
	let required = props.required || false;

	// Current input value
	let inputValue = $state('');
	// Reference to the input element
	let inputRef = $state<HTMLInputElement | null>(null);

	// Generate unique ID for tags
	function generateId(): string {
		return Date.now().toString(36) + Math.random().toString(36).substring(2);
	}

	// Add a new tag
	function addTag() {
		if (inputValue.trim() === '') return;

		const newTag: Tag = {
			id: generateId(),
			text: inputValue.trim()
		};

		tags = [...tags, newTag];
		inputValue = '';

		if (onTagsChange) {
			onTagsChange(tags);
		}
	}

	// Remove a tag
	function removeTag(id: string) {
		tags = tags.filter((tag) => tag.id !== id);

		if (onTagsChange) {
			onTagsChange(tags);
		}

		// Focus back on input after removing a tag
		inputRef?.focus();
	}

	// Handle key down events
	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			addTag();
		} else if (event.key === 'Backspace' && inputValue === '' && tags.length > 0) {
			// Remove the last tag when pressing backspace with empty input
			const lastTag = tags[tags.length - 1];
			removeTag(lastTag.id);
		}
	}

	// When a user clicks on the container, focus the input
	function focusInput() {
		inputRef?.focus();
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="tag-input-container bg-yellow-400" onclick={focusInput}>
	<div class="tags-and-input">
		{#each tags as tag (tag.id)}
			<div class="tag">
				<span class="tag-text">{tag.text}</span>
				<button
					type="button"
					class="remove-tag"
					onclick={(e) => {
						e.stopPropagation();
						removeTag(tag.id);
					}}
					aria-label={`Remove ${tag.text}`}
				>
					&times;
				</button>
			</div>
		{/each}

		<input
			type="text"
			bind:this={inputRef}
			bind:value={inputValue}
			onkeydown={handleKeyDown}
			placeholder={tags.length === 0 ? placeholder : ''}
			class="tag-input"
			aria-label={name}
			{required}
		/>
		<!-- Hidden input to store tags value for form submission -->
		<input type="hidden" {name} value={JSON.stringify(tags.map((tag) => tag.text))} {required} />
	</div>
</div>

<style>
	.tag-input-container {
		border: 1px solid #ccc;
		border-radius: 4px;
		padding: 4px 8px;
		cursor: text;
		display: flex;
		align-items: center;
		min-height: 38px;
		width: 100%;
		background-color: #fff;
	}

	.tag-input-container:focus-within {
		border-color: #4f46e5;
		box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
		outline: none;
	}

	.tags-and-input {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		width: 100%;
		align-items: center;
	}

	.tag {
		display: flex;
		align-items: center;
		background-color: #e4e4e7;
		border-radius: 16px;
		padding: 2px 8px;
		font-size: 14px;
	}

	.tag-text {
		margin-right: 4px;
	}

	.remove-tag {
		background: none;
		border: none;
		color: #555;
		cursor: pointer;
		font-size: 16px;
		line-height: 1;
		padding: 0 2px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.remove-tag:hover {
		color: #000;
	}

	.tag-input {
		flex: 1;
		min-width: 60px;
		border: none;
		outline: none;
		padding: 4px 0;
		font-size: 14px;
		background: transparent;
	}

	.tag-input:focus {
		border: none;
		outline: none;
		box-shadow: none;
	}
</style>

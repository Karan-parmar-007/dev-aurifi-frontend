<script lang="ts">
	import {
		Drawer,
		Button,
		CloseButton,
		Sidebar,
		SidebarBrand,
		SidebarCta,
		SidebarDropdownItem,
		SidebarDropdownWrapper,
		SidebarGroup,
		SidebarItem,
		SidebarWrapper,
		Timeline,
		TimelineItem
	} from 'flowbite-svelte';
	import { CalendarWeekSolid } from 'flowbite-svelte-icons';

	import { sineIn } from 'svelte/easing';
	import { breakDownBar } from '../../store/toogleModal.svelte';

	let transitionParams = {
		x: 320,
		duration: 200,
		easing: sineIn
	};

	let data = [
		{
			step_name: 'Column mapping',
			step_description: '20 columns mapped',
			updated_at: '12 Aug'
		},
		{
			step_name: 'Data Formating',
			step_description: 'Process Name/Formula',
			updated_at: '12 Aug'
		},
		{
			step_name: 'New Fields Added',
			step_description: 'Process Name/Formula',
			updated_at: '12 Aug'
		},
		{
			step_name: 'RBI Guidelines',
			step_description: 'Process Name/Formula',
			updated_at: '12 Aug'
		}
	];
</script>

<Drawer
	transitionType="fly"
	{transitionParams}
	bind:hidden={breakDownBar.isBreakDownBarVisible}
	id="sidebar3"
	position="absolute"
	class="right-0 start-[1p] w-96"
>
	<div class="flex items-center">
		<h5
			id="drawer-navigation-label-3"
			class="text-base text-xl font-semibold text-black dark:text-gray-400"
		>
			<span>BreakDown</span>
			<div class=""></div>
		</h5>
		<CloseButton
			onclick={() => (breakDownBar.isBreakDownBarVisible = true)}
			class="mb-4 dark:text-white"
		/>
	</div>
	<Sidebar>
		<SidebarWrapper divClass="overflow-y-auto py-4 px-3 rounded-sm dark:bg-gray-800">
			<SidebarGroup>
				<Timeline order="vertical">
					{#each data as step}
						<TimelineItem title={step.step_name} date={step.updated_at}>
							{#snippet orientationSlot()}
								<span
									class="bg-primary-200 dark:bg-primary-900 absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full ring-8 ring-white dark:ring-gray-900"
								>
									<CalendarWeekSolid class="text-primary-600 dark:text-primary-400 h-4 w-4" />
								</span>
							{/snippet}
							<p class="mb-2 text-base font-normal text-gray-500 dark:text-gray-400">
								{step.step_description}
							</p>
							<div class="flex items-center gap-4 text-sm font-semibold text-blue-700">
								<button class="cursor-pointer">Original File</button>
								<button class="cursor-pointer">Final File</button>
							</div>
						</TimelineItem>
					{/each}
					<!-- <TimelineItem
						title="Flowbite Application UI v2.0.0"
						date="Released on January 13th, 2022"
					>
						{#snippet orientationSlot()}
							<span
								class="bg-primary-200 dark:bg-primary-900 absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full ring-8 ring-white dark:ring-gray-900"
							>
								<CalendarWeekSolid class="text-primary-600 dark:text-primary-400 h-4 w-4" />
							</span>
						{/snippet}
						<p class="mb-4 text-base font-normal text-gray-500 dark:text-gray-400">
							Get access to over 20+ pages including a dashboard layout, charts, kanban board,
							calendar, and pre-order E-commerce & Marketing pages.
						</p>
					</TimelineItem>
					<TimelineItem title="Flowbite Figma v1.3.0" date="Released on December 7th, 2021">
						{#snippet orientationSlot()}
							<span
								class="bg-primary-200 dark:bg-primary-900 absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full ring-8 ring-white dark:ring-gray-900"
							>
								<CalendarWeekSolid class="text-primary-600 dark:text-primary-400 h-4 w-4" />
							</span>
						{/snippet}
						<p class="text-base font-normal text-gray-500 dark:text-gray-400">
							All of the pages and components are first designed in Figma and we keep a parity
							between the two versions even as we update the project.
						</p>
					</TimelineItem>
					<TimelineItem title="Flowbite Library v1.2.2" date="Released on December 2nd, 2021">
						{#snippet orientationSlot()}
							<span
								class="bg-primary-200 dark:bg-primary-900 absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full ring-8 ring-white dark:ring-gray-900"
							>
								<CalendarWeekSolid class="text-primary-600 dark:text-primary-400 h-4 w-4" />
							</span>
						{/snippet}
						<p class="text-base font-normal text-gray-500 dark:text-gray-400">
							Get started with dozens of web components and interactive elements built on top of
							Tailwind CSS.
						</p>
					</TimelineItem> -->
				</Timeline>
			</SidebarGroup>
		</SidebarWrapper>
	</Sidebar>
</Drawer>

export const modal = $state({ isModalOpen: false });
export const transactionModal = $state({ isTransactionModalOpen: false });

export const InsertionModal = $state({ isInsertionModalOpen: false });
export const EjectionModal = $state({ isEjectionModalOpen: false });

export const systemColumnModal = $state({ isSystemColumnModalOpen: false });
export const TransactionsystemColumnModal = $state({ isTransactionSystemColumnModalOpen: false });
export const assetClassModal = $state({ isAssetClassModalOpen: false });
export const addUsersModal = $state({ isAddUsersModalOpen: false });

export const DataFormatModal = $state({ isDataFormatModalOpen: false });
export const NumberFormatModal = $state({ isNumberFormatModalOpen: false });
export const CurrencyFormatModal = $state({ isCurrencyFormatModalOpen: false });

export const generateFormulaModal = $state({ isGenerateFormulaModalOpen: false });
export const additionalRuleModal = $state({ isAdditionalRuleModalOpen: false });
export const rbiRulesModal = $state({ isRbiRulesModalOpen: false });
export const RuleModal = $state({ isRuleModalOpen: false });
export const CustomRuleModal = $state({ isCustomRuleModalOpen: false, isNewVersion: false });
export const PreviewModal = $state({ isPreviewModalOpen: false });
export class DeleteModal {
	isDeleteModalOpen = $state(false);
	onConfirmDelete = $state<((index: number) => void) | null>(null);
}

export const deleteModal = new DeleteModal();

// You can also create individual modal instances if needed
export const ruleModal = new (class {
	isRuleModalOpen = $state(false);
})();

export const SideBar = $state({ isSideBarVisible: true });
export const breakDownBar = $state({ isBreakDownBarVisible: true });
export const breakdownTransactionID = $state({ transaction_id: null });

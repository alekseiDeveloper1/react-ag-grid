import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { vi } from 'vitest';
import {
    RowNumbersModule,
    SetFilterModule,
    MultiFilterModule,
    AdvancedFilterModule,
    CellSelectionModule,
    RichSelectModule,
    RowGroupingModule,
    RowGroupingPanelModule,
    GroupFilterModule,
    SideBarModule,
    ColumnMenuModule,
    ContextMenuModule,
    StatusBarModule,
    ExcelExportModule,
    ClipboardModule,
    PivotModule,
    AllCommunityModule,
    ModuleRegistry,
} from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    AllCommunityModule,
    RowNumbersModule,
    SetFilterModule,
    MultiFilterModule,
    AdvancedFilterModule,
    CellSelectionModule,
    RichSelectModule,
    RowGroupingModule,
    RowGroupingPanelModule,
    GroupFilterModule,
    PivotModule,
    SideBarModule,
    ColumnMenuModule,
    ContextMenuModule,
    StatusBarModule,
    ExcelExportModule,
    ClipboardModule,
]);
// Suppress AG Grid License errors in tests
const originalConsoleError = console.error;
vi.spyOn(console, 'error').mockImplementation((msg, ...args) => {
    if (typeof msg === 'string' && (msg.includes('AG Grid Enterprise') || msg.includes('License Key'))) {
        return;
    }
    originalConsoleError(msg, ...args);
});

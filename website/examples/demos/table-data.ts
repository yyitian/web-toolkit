import type {
  SuperTableColumn,
  SuperTableQuery,
  SuperTableResult,
} from '@/components/SuperTable/types.ts';

export interface DemoTableRow {
  id: number;
  name: string;
  enabled: boolean;
  tags: string[];
  progress: number;
  createdAt: string;
  owner: { name: string };
}

const rows: DemoTableRow[] = Array.from({ length: 57 }, (_, index) => ({
  id: index + 1,
  name: `示例任务 ${String(index + 1).padStart(2, '0')}`,
  enabled: index % 3 !== 0,
  tags: index % 2 ? ['报表'] : ['自动化', '巡检'],
  progress: (index * 13) % 101,
  createdAt: `2026-11-${String((index % 9) + 1).padStart(2, '0')} 12:30:00`,
  owner: { name: index % 2 ? '小林' : '小周' },
}));

export const tableColumns: SuperTableColumn<DemoTableRow>[] = [
  { prop: 'index', label: '序号', tableType: 'index', width: 64 },
  {
    prop: 'name',
    label: '任务名称',
    minWidth: 180,
    sortable: true,
    search: true,
  },
  { prop: 'owner.name', label: '负责人', width: 100 },
  {
    prop: 'enabled',
    label: '状态',
    tableType: 'slot',
    width: 100,
    search: {
      formType: 'select',
      props: {
        clearable: true,
        options: [
          { label: '启用', value: true },
          { label: '停用', value: false },
        ],
      },
    },
  },
  { prop: 'tags', label: '标签', tableType: 'tag', width: 160 },
  {
    prop: 'progress',
    label: '进度',
    tableType: 'progress',
    width: 160,
    sortable: true,
  },
  {
    prop: 'createdAt',
    label: '创建时间',
    tableType: 'date',
    width: 180,
    search: true,
  },
  {
    prop: 'operation',
    label: '操作',
    tableType: 'operation',
    width: 100,
    fixed: 'right',
  },
];

// 仅供演示：生产项目应在请求适配函数中调用自己的后端。
export function queryDemoRows(
  query: SuperTableQuery,
): SuperTableResult<DemoTableRow> {
  let filtered = rows.filter((row) => {
    if (query.search.name && !row.name.includes(String(query.search.name)))
      return false;
    if (
      typeof query.search.enabled === 'boolean' &&
      row.enabled !== query.search.enabled
    )
      return false;
    const range = query.search.createdAt;
    if (
      Array.isArray(range) &&
      range.length === 2 &&
      (row.createdAt.slice(0, 10) < String(range[0]).slice(0, 10) ||
        row.createdAt.slice(0, 10) > String(range[1]).slice(0, 10))
    )
      return false;
    return true;
  });
  const sort = query.sort;
  if (sort) {
    filtered = filtered.toSorted((a, b) => {
      const left = a[sort.prop as keyof DemoTableRow];
      const right = b[sort.prop as keyof DemoTableRow];
      const comparison =
        typeof left === 'number' && typeof right === 'number'
          ? left - right
          : String(left).localeCompare(String(right), 'zh-CN', {
              numeric: true,
            });
      return sort.order === 'ascending' ? comparison : -comparison;
    });
  }
  return {
    data: filtered.slice(
      (query.page - 1) * query.pageSize,
      query.page * query.pageSize,
    ),
    total: filtered.length,
  };
}

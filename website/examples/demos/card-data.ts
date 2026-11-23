import type {
  SuperTableColumn,
  SuperTableQuery,
} from '@/components/SuperTable/types.ts';
import type { SuperTagValue } from '@/components/SuperTags/types.ts';

export interface CardDemoRow {
  id: number;
  name: string;
  description: string;
  image?: string;
  status: string;
  enabled: boolean;
  tags: SuperTagValue[];
  createdAt: string;
  owner: { name: string };
}
function illustration(index: number) {
  const color = ['#4f8df7', '#8765d7', '#2c9f8b'][index % 3];
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 270"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="${color}"/><stop offset="1" stop-color="#142d52"/></linearGradient></defs><path fill="url(#bg)" d="M0 0h480v270H0z"/><g fill="none" stroke="white" stroke-opacity=".25" stroke-width="2"><path d="M0 195h130l48-60h120l54-60h128M70 0v70l50 50v150"/><circle cx="240" cy="135" r="62"/><circle cx="240" cy="135" r="82"/></g><path fill="white" fill-opacity=".9" d="m225 100 42 35-42 35z"/><circle cx="350" cy="75" r="7" fill="white" fill-opacity=".6"/></svg>`)}`;
}
export function createCardRows(): CardDemoRow[] {
  return Array.from({ length: 72 }, (_, index) => ({
    id: index + 1,
    name:
      index === 0
        ? '安全自动化巡检与任务编排的长名称示例'
        : `自动化任务 ${String(index + 1).padStart(2, '0')}`,
    description:
      index === 0
        ? '定时收集任务运行情况，自动处理异常并通知负责人，汇总巡检结果与历史趋势，帮助团队及时发现服务和资源风险。'
        : '持续监测、自动编排，统一展示任务执行情况。',
    image:
      index === 1
        ? undefined
        : index === 2
          ? 'data:image/png;base64,AA=='
          : illustration(index),
    status: ['running', 'pending', 'failed', 'success', 'stopped', 'unknown'][
      index % 6
    ]!,
    enabled: index % 3 !== 0,
    tags: [
      { label: '自动化', props: { type: 'success' } },
      '巡检',
      '安全运营',
      '定时执行',
    ],
    createdAt: `2026-11-${String((index % 19) + 1).padStart(2, '0')} 12:30:00`,
    owner: { name: index % 2 ? '小林' : '小周' },
  }));
}
export const cardColumns: SuperTableColumn<CardDemoRow>[] = [
  {
    prop: 'name',
    label: '任务名称',
    search: true,
    sortable: true,
    minWidth: 220,
  },
  { prop: 'owner.name', label: '负责人', width: 100 },
  { prop: 'status', label: '执行状态', tableType: 'slot', width: 120 },
  { prop: 'tags', label: '标签', tableType: 'tag', width: 170 },
  {
    prop: 'createdAt',
    label: '创建时间',
    tableType: 'date',
    sortable: true,
    search: true,
  },
];
export function queryCardRows(rows: CardDemoRow[], query: SuperTableQuery) {
  const range = query.search.createdAt;
  let filtered = rows.filter(
    (row) =>
      (!query.search.name || row.name.includes(String(query.search.name))) &&
      (!Array.isArray(range) ||
        !range.length ||
        (row.createdAt >= String(range[0]) &&
          row.createdAt <= String(range[1]))),
  );
  const sort = query.sort;
  if (sort)
    filtered = filtered.toSorted(
      (a, b) =>
        String(a[sort.prop as keyof CardDemoRow]).localeCompare(
          String(b[sort.prop as keyof CardDemoRow]),
          'zh-CN',
          { numeric: true },
        ) * (sort.order === 'ascending' ? 1 : -1),
    );
  return {
    data: filtered.slice(
      (query.page - 1) * query.pageSize,
      query.page * query.pageSize,
    ),
    total: filtered.length,
  };
}

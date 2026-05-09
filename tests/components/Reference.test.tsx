import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Reference } from '../../src/components/Reference';
import { db } from '../../src/db';
import type { Article } from '../../src/db';

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: { language: 'en', changeLanguage: vi.fn() },
    }),
  };
});

vi.mock('lucide-react', () => {
  const iconNames = [
    'Library', 'Plus', 'Search', 'ChevronLeft', 'Minimize2', 'Maximize2', 'Link2', 'BookOpen', 'X',
  ];
  const icons: Record<string, React.FC> = {};
  for (const name of iconNames) {
    icons[name] = (props: Record<string, unknown>) => {
      const { createElement } = require('react');
      return createElement('svg', { 'data-testid': `icon-${name}`, ...props });
    };
  }
  return icons;
});

const articleA: Article = {
  id: 'a-alpha',
  title: 'Alpha Unique Title',
  content: 'Some body for alpha',
  date: '2024',
  type: 'REF-A',
  category: 'journal',
  tags: ['memo'],
};

const articleB: Article = {
  id: 'b-beta',
  title: 'Beta Other Piece',
  content: 'Different content',
  date: '2025',
  type: 'REF-B',
  category: 'journal',
};

describe('Reference', () => {
  beforeEach(async () => {
    await db.articles.clear();
    await db.canvases.clear();
    vi.restoreAllMocks();
  });

  it('搜索框按标题过滤侧栏列表项', async () => {
    const user = userEvent.setup();
    await db.articles.bulkAdd([articleA, articleB]);
    const setId = vi.fn();

    render(
      <Reference articles={[articleA, articleB]} activeReferenceId="a-alpha" setActiveReferenceId={setId} />,
    );

    expect(screen.getByTestId('reference-list-item-a-alpha')).toBeInTheDocument();
    expect(screen.getByTestId('reference-list-item-b-beta')).toBeInTheDocument();

    const search = screen.getByPlaceholderText('reference.search_refs');
    await user.type(search, 'Beta');

    await waitFor(() => {
      expect(screen.queryByTestId('reference-list-item-a-alpha')).toBeNull();
    });
    expect(screen.getByTestId('reference-list-item-b-beta')).toBeInTheDocument();
  });

  it('点击 + 新建文献并写入 IndexedDB', async () => {
    const user = userEvent.setup();
    const setId = vi.fn();
    await db.articles.add(articleA);

    render(<Reference articles={[articleA]} activeReferenceId="a-alpha" setActiveReferenceId={setId} />);

    const addBtn = screen.getByRole('button', { name: 'reference.add_article' });
    await user.click(addBtn);

    await waitFor(async () => {
      expect(await db.articles.count()).toBe(2);
    });
    const rows = await db.articles.toArray();
    const created = rows.find((r) => r.id !== 'a-alpha');
    expect(created?.title).toBe('reference.new_article_title');
    expect(created?.category).toBe('journal');
    expect(created?.tags).toEqual([]);
    expect(created?.linkedCanvasIds).toEqual([]);
    expect(setId).toHaveBeenCalledWith(expect.stringMatching(/.+/));
  });

  it('引用文献按钮写入剪贴板', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue({ writeText } as Clipboard);

    const withAuthor = { ...articleA, author: 'Jane' };
    await db.articles.add(withAuthor);

    render(<Reference articles={[withAuthor]} activeReferenceId="a-alpha" setActiveReferenceId={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'reference.citation' }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
    });
    expect(String(writeText.mock.calls[0][0])).toContain('Alpha Unique Title');
    expect(String(writeText.mock.calls[0][0])).toContain('Jane');
  });

  it('关联画布名称点击调用 onOpenCanvas', async () => {
    const user = userEvent.setup();
    await db.canvases.add({
      id: 'cv-test',
      name: 'Linked Canvas X',
      createdAt: 1,
      updatedAt: 1,
    });
    const linked: Article = {
      ...articleA,
      linkedCanvasIds: ['cv-test'],
    };
    const onOpen = vi.fn();

    render(
      <Reference articles={[linked]} activeReferenceId="a-alpha" setActiveReferenceId={vi.fn()} onOpenCanvas={onOpen} />,
    );

    const canvasBtn = await waitFor(() =>
      screen.getByRole('button', { name: 'Linked Canvas X' }),
    );
    await user.click(canvasBtn);

    expect(onOpen).toHaveBeenCalledWith('cv-test');
  });

  it('分类筛选为 map 时隐藏非 map 文献卡片', async () => {
    const user = userEvent.setup();
    const mapArt: Article = { ...articleB, id: 'm1', category: 'map', title: 'Map Doc' };
    await db.articles.bulkAdd([articleA, mapArt]);

    render(<Reference articles={[articleA, mapArt]} activeReferenceId="m1" setActiveReferenceId={vi.fn()} />);

    const mapPill = screen.getByRole('button', { name: 'reference.filter_map' });
    await user.click(mapPill);

    await waitFor(() => {
      expect(screen.queryByTestId('reference-list-item-a-alpha')).toBeNull();
    });
    expect(screen.getByTestId('reference-list-item-m1')).toBeInTheDocument();
  });
});

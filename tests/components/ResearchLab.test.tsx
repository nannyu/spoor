import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ResearchLab } from '../../src/components/ResearchLab';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, any>) => {
      const map: Record<string, string> = {
        'lab.investigate': 'What would you like to investigate?',
        'lab.placeholder': 'Search topic...',
        'lab.approve': 'Approve & Execute',
        'lab.executing': 'Agent Execution Log',
        'lab.report': 'Synthesized Report',
        'lab.new_research': 'New Research',
        'lab.past_sessions': 'Past Sessions',
        'lab.agent_title': 'Deep Research Agent',
        'lab.searching': 'Searching the web...',
        'lab.search_complete': `${opts?.count ?? 0} web sources found`,
        'lab.search_fallback': 'Search unavailable, using offline mode',
        'lab.plan_edit_hint': 'Edit plan hint',
        'lab.plan_revision_placeholder': 'Revision instructions...',
        'lab.plan_revision_apply': 'Update outline with AI',
        'lab.plan_revision_applying': 'Updating outline...',
        'lab.ai_generate_plan': 'Generate plan for: {{query}}',
        'lab.ai_revise_plan': 'Revise plan for {{query}}. Plan: {{plan}}. Instruction: {{instruction}}',
        'lab.ai_research_report': 'Generate report for: {{query}}',
        'nodes.ai_loading': 'Synthesizing...',
      };
      let result = map[key] ?? key;
      if (opts) {
        Object.entries(opts).forEach(([k, v]) => {
          result = result.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
        });
      }
      return result;
    },
    i18n: { language: 'en' },
  }),
}));

// Mock search module
const mockMetasoSearch = vi.fn();
vi.mock('../../src/services/search', () => ({
  metasoSearch: (...args: any[]) => mockMetasoSearch(...args),
  buildSearchContext: (results: any) => {
    if (!results?.webpages?.length) return '';
    return results.webpages.map((w: any) => `[Source] ${w.title}: ${w.snippet}`).join('\n');
  },
}));

// Mock aiI18n
vi.mock('../../src/utils/aiI18n', () => ({
  getLocaleDirective: () => 'Reply in English.',
}));

const baseConfig = {
  provider: 'openai',
  apiKey: 'sk-test',
  baseUrl: '',
  model: 'gpt-4o',
};

describe('ResearchLab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders idle state with input', () => {
    const callAI = vi.fn();
    render(<ResearchLab aiConfig={baseConfig} callAI={callAI} />);
    expect(screen.getByText('What would you like to investigate?')).toBeTruthy();
    expect(screen.getByPlaceholderText('Search topic...')).toBeTruthy();
  });

  it('calls callAI without search context when no metasoApiKey', async () => {
    const callAI = vi.fn().mockResolvedValue(
      JSON.stringify([
        { title: 'Step 1', desc: 'Desc 1' },
        { title: 'Step 2', desc: 'Desc 2' },
        { title: 'Step 3', desc: 'Desc 3' },
      ])
    );
    render(<ResearchLab aiConfig={baseConfig} callAI={callAI} />);

    const input = screen.getByPlaceholderText('Search topic...');
    fireEvent.change(input, { target: { value: 'memory loss' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(callAI).toHaveBeenCalledTimes(1);
    });

    // Should NOT have called metasoSearch (no key)
    expect(mockMetasoSearch).not.toHaveBeenCalled();

    // callAI prompt should NOT contain search context
    const prompt = callAI.mock.calls[0][0].prompt;
    expect(prompt).not.toContain('[Source]');
    expect(prompt).toContain('memory loss');
  });

  it('calls metasoSearch when metasoApiKey is provided', async () => {
    mockMetasoSearch.mockResolvedValue({
      credits: 1,
      total: 1,
      webpages: [{ title: 'Research', link: 'https://r.com', snippet: 'Findings', score: 'high', date: '2026-01-01' }],
    });

    const callAI = vi.fn().mockResolvedValue(
      JSON.stringify([
        { title: 'Step 1', desc: 'Desc' },
        { title: 'Step 2', desc: 'Desc' },
        { title: 'Step 3', desc: 'Desc' },
      ])
    );

    render(<ResearchLab aiConfig={{ ...baseConfig, metasoApiKey: 'sk-metaso-test' }} callAI={callAI} />);

    const input = screen.getByPlaceholderText('Search topic...');
    fireEvent.change(input, { target: { value: 'AI research' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(mockMetasoSearch).toHaveBeenCalledWith('AI research', { apiKey: 'sk-metaso-test' });
    });

    await waitFor(() => {
      expect(callAI).toHaveBeenCalledTimes(1);
    });

    // callAI prompt SHOULD contain search context
    const prompt = callAI.mock.calls[0][0].prompt;
    expect(prompt).toContain('[Source]');
    expect(prompt).toContain('Findings');
  });

  it('degrades gracefully when metasoSearch fails', async () => {
    mockMetasoSearch.mockRejectedValue(new Error('Network error'));

    const callAI = vi.fn().mockResolvedValue(
      JSON.stringify([
        { title: 'Step 1', desc: 'Desc' },
        { title: 'Step 2', desc: 'Desc' },
        { title: 'Step 3', desc: 'Desc' },
      ])
    );

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(<ResearchLab aiConfig={{ ...baseConfig, metasoApiKey: 'sk-bad-key' }} callAI={callAI} />);

    const input = screen.getByPlaceholderText('Search topic...');
    fireEvent.change(input, { target: { value: 'test query' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(callAI).toHaveBeenCalledTimes(1);
    });

    // Should have warned about search failure
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Metaso search failed'),
      expect.any(String)
    );

    // callAI prompt should NOT contain search context (graceful fallback)
    const prompt = callAI.mock.calls[0][0].prompt;
    expect(prompt).not.toContain('[Source]');

    consoleSpy.mockRestore();
  });

  it('includes user-approved research plan in the report prompt when executing', async () => {
    const planJson = JSON.stringify([
      { title: 'Step 1', desc: 'Desc 1' },
      { title: 'Step 2', desc: 'Desc 2' },
      { title: 'Step 3', desc: 'Desc 3' },
    ]);
    const reportJson = JSON.stringify({
      intro: 'Intro',
      points: [{ title: 'P1', text: 'T1' }],
      conclusion: 'Done',
    });
    const callAI = vi.fn().mockResolvedValueOnce(planJson).mockResolvedValueOnce(reportJson);

    render(<ResearchLab aiConfig={baseConfig} callAI={callAI} />);

    const topicInput = screen.getByPlaceholderText('Search topic...');
    fireEvent.change(topicInput, { target: { value: 'memory loss' } });
    fireEvent.submit(topicInput.closest('form')!);

    await waitFor(() => {
      expect(screen.getByLabelText('Step 1 title')).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText('Step 1 title'), { target: { value: 'Edited step one' } });
    fireEvent.click(screen.getByRole('button', { name: /Approve & Execute/i }));

    await waitFor(() => {
      expect(callAI).toHaveBeenCalledTimes(2);
    });

    const reportPrompt = callAI.mock.calls[1][0].prompt as string;
    expect(reportPrompt).toContain('user-approved research plan');
    expect(reportPrompt).toContain('Edited step one');
    expect(reportPrompt).toContain('memory loss');
  });

  it('calls AI to revise plan from the revision textarea', async () => {
    const initialPlan = JSON.stringify([
      { title: 'Step 1', desc: 'Desc 1' },
      { title: 'Step 2', desc: 'Desc 2' },
      { title: 'Step 3', desc: 'Desc 3' },
    ]);
    const revisedPlan = JSON.stringify([{ title: 'Only one step', desc: 'Condensed' }]);
    const callAI = vi.fn().mockResolvedValueOnce(initialPlan).mockResolvedValueOnce(revisedPlan);

    render(<ResearchLab aiConfig={baseConfig} callAI={callAI} />);

    const topicInput = screen.getByPlaceholderText('Search topic...');
    fireEvent.change(topicInput, { target: { value: 'topic t' } });
    fireEvent.submit(topicInput.closest('form')!);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Revision instructions...')).toBeTruthy();
    });

    fireEvent.change(screen.getByPlaceholderText('Revision instructions...'), {
      target: { value: 'Merge everything into one step' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Update outline with AI/i }));

    await waitFor(() => {
      expect(callAI).toHaveBeenCalledTimes(2);
    });

    const revisePrompt = callAI.mock.calls[1][0].prompt as string;
    expect(revisePrompt).toContain('Merge everything into one step');
    expect(revisePrompt).toContain('Step 1');

    await waitFor(() => {
      expect(screen.getByLabelText('Step 1 title')).toHaveValue('Only one step');
    });
  });

  it('uses fallback plan when model returns empty or invalid JSON', async () => {
    const callAI = vi.fn().mockResolvedValueOnce('[]');

    render(<ResearchLab aiConfig={baseConfig} callAI={callAI} />);

    const topicInput = screen.getByPlaceholderText('Search topic...');
    fireEvent.change(topicInput, { target: { value: 'topic' } });
    fireEvent.submit(topicInput.closest('form')!);

    await waitFor(() => {
      expect(screen.getByLabelText('Step 1 title')).toHaveValue('Archive Extraction');
    });
    expect(callAI).toHaveBeenCalledTimes(1);
  });

  it('keeps plan unchanged when AI revision returns empty array', async () => {
    const planJson = JSON.stringify([{ title: 'Step 1', desc: 'Desc 1' }]);
    const callAI = vi.fn().mockResolvedValueOnce(planJson).mockResolvedValueOnce('[]');

    render(<ResearchLab aiConfig={baseConfig} callAI={callAI} />);

    fireEvent.change(screen.getByPlaceholderText('Search topic...'), { target: { value: 't' } });
    fireEvent.submit(screen.getByPlaceholderText('Search topic...').closest('form')!);

    await waitFor(() => screen.getByPlaceholderText('Revision instructions...'));

    fireEvent.change(screen.getByPlaceholderText('Revision instructions...'), {
      target: { value: 'please break this' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Update outline with AI/i }));

    await waitFor(() => expect(callAI).toHaveBeenCalledTimes(2));

    await waitFor(() => {
      expect(screen.getByLabelText('Step 1 title')).toHaveValue('Step 1');
    });
    expect(screen.getByPlaceholderText('Revision instructions...')).toHaveValue('please break this');
  });
});

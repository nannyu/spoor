import { useEffect } from 'react';
import { db } from '../db';

/** Seed the database with default agents, nodes, and articles on first run. */
export function useSeedData() {
  useEffect(() => {
    const seed = async () => {
      const defaultCanvas = await db.canvases.get('default');
      if (!defaultCanvas) {
        await db.canvases.add({
          id: 'default',
          name: 'Main Workspace',
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }

      const agentIds = ['challenger', 'interviewer', 'synthesizer', 'stylist', 'futurist', 'pragmatist'];
      const existingAgents = await db.agents.toArray();
      const existingIds = new Set(existingAgents.map(a => a.id));
      const missingIds = agentIds.filter(id => !existingIds.has(id));

      if (missingIds.length > 0) {
        const allSystemAgents = [
          { id: 'challenger', name: 'The Challenger', role: 'Debater', prompt: 'You are a critical Debater. Do not agree with the user or simply follow orders. Challenge the premise of what is connected to you. Point out logical flaws, demand stronger evidence, and actively try to find holes in the argument to help the user refine their thoughts.', temperature: 0.7, creativity: 0.4 },
          { id: 'interviewer', name: 'AI Interviewer', role: 'Journalist', prompt: 'You are an AI Interviewer who takes initiative. Do not wait for commands. Based on the provided context, actively start asking probing questions to draw out deeper narratives or follow-up ideas.', temperature: 0.7, creativity: 0.4 },
          { id: 'synthesizer', name: 'The Synthesizer', role: 'Connector', prompt: 'You are a Connector/Synthesizer. Your goal is to find hidden patterns and non-obvious relationships between the notes and ideas connected to you. Suggest how disparate concepts can be merged into a cohesive whole.', temperature: 0.8, creativity: 0.7 },
          { id: 'stylist', name: 'The Stylist', role: 'Editor', prompt: 'You are a Master Editor and Stylist. Your role is to take the provided content and elevate its quality. Focus on tone, clarity, and impact. Make the text compelling, professional, or poetic depending on the context.', temperature: 0.6, creativity: 0.5 },
          { id: 'futurist', name: 'The Futurist', role: 'Visionary', prompt: 'You are a Visionary Futurist. Based on the ideas connected to you, project their evolution 10-20 years into the future. What are the long-term implications, potential disruptors, and wild possibilities?', temperature: 0.9, creativity: 0.9 },
          { id: 'pragmatist', name: 'The Pragmatist', role: 'Realist', prompt: 'You are a realistic Pragmatist. Your job is to ground the user\'s ideas in reality. Identify practical constraints, missing logistical steps, potential costs, and immediate roadblocks that need to be addressed.', temperature: 0.4, creativity: 0.2 }
        ];
        
        const toAdd = allSystemAgents.filter(a => missingIds.includes(a.id));
        await db.agents.bulkPut(toAdd);
      }

      const totalCount = await db.agents.count();
      if (totalCount <= 6) {
        const nodeCount = await db.nodes.count();
        if (nodeCount === 0) {
          await db.articles.put({
            id: 'ref-042',
            title: 'Spatial Encoding in Reconstructive Memory',
            content: 'The human mind does not merely store experiences as isolated visual or auditory files. Instead, it constructs architectural spaces where these memories represent structural loads...',
            date: '1994',
            type: 'REF-042'
          });

          await db.nodes.bulkPut([
            { id: 'theme', type: 'theme', content: 'The Memory Architect', x: 200, y: 300 },
            { id: 'insp1', type: 'note', content: 'Spatial architecture of trauma', x: 500, y: 200 },
            { id: 'ai', type: 'ai', content: 'Memory is not a storage, but a navigation.', x: 500, y: 400 },
            { id: 'insp2', type: 'note', content: 'Non-euclidean memory leaks', x: 800, y: 300 }
          ]);

          await db.edges.bulkPut([
            { id: 'e1', from: 'theme', to: 'insp1' },
            { id: 'e2', from: 'theme', to: 'ai' },
            { id: 'e3', from: 'ai', to: 'insp2' },
            { id: 'e4', from: 'insp1', to: 'insp2' }
          ]);
        }
      }
    };
    seed();
  }, []);
}

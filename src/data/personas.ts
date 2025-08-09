export interface Persona {
  id: string;
  name: string;
  tagline: string;
  description: string;
  avatarUrl: string;
  status: 'active' | 'coming_soon';
  skills?: string[];
}

export const personas: Persona[] = [
  {
    id: 'nomads-compass',
    name: "Nomad's Compass",
    tagline: "Your AI Travel Planning Expert",
    description: "With extensive knowledge of destinations worldwide, cultural insights, and budget optimization techniques, I'm here to transform your travel ideas into detailed, actionable itineraries. Whether you're seeking adventure, relaxation, cultural immersion, or culinary experiences, I'll craft the perfect journey for you.",
    avatarUrl: "/images/nomad.png",
    status: 'active',
    skills: ['Destination Expert', 'Budget Optimizer', 'Cultural Guide', 'Adventure Planner']
  },
  {
    id: 'elysian-itineraries',
    name: "Elysian Itineraries",
    tagline: "Elite Bespoke Luxury Travel",
    description: "An elite travel concierge specializing in bespoke luxury travel for special occasions like honeymoons and anniversaries.",
    avatarUrl: "/images/elysian.png",
    status: 'coming_soon',
    skills: ['Luxury Concierge', 'Romance Specialist', 'VIP Experiences', 'Fine Dining']
  },
  {
    id: 'kindred-quests',
    name: "Kindred Quests",
    tagline: "Memorable Family Adventures",
    description: "A friendly and practical expert in planning memorable family trips that are fun for both kids and adults.",
    avatarUrl: "/images/kindred.png",
    status: 'coming_soon',
    skills: ['Family Expert', 'Kid-Friendly Activities', 'Educational Tours', 'Safety First']
  }
];

export const getActivePersona = () => personas.find(p => p.status === 'active') || personas[0];
export const getAllPersonas = () => personas;
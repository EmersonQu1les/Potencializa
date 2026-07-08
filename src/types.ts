/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Question {
  id: string;
  label: string;
  placeholder?: string;
  type: 'text' | 'textarea' | 'word' | 'emotion';
}

export interface ChapterDef {
  id: number; // 1 to 8
  title: string;
  subtitle?: string;
  dateLabel?: string;
  questions: Question[];
}

export interface ParticipantAnswers {
  [questionId: string]: string;
}

export interface Participant {
  id: string;
  name: string;
  photo?: string; // Base64 string or preset SVG/identifier
  active: boolean;
  lastHeartbeat: number;
  status: 'idle' | 'answering' | 'finished';
  currentChapterSubmitted: number; // The highest chapter id they have completed
  answers: {
    [chapterId: number]: ParticipantAnswers;
  };
}

export interface SessionState {
  currentChapter: number; 
  // 0: Awaiting Start (Splash "Iniciar Jornada")
  // -1: Abertura (Poetic Intro: "Existem caminhos...")
  // 1 to 8: Active Chapters
  // 9: Chapter 8 / Blank space / Timeline compilation
  // 10: Final Journal of Board (Diário de Bordo)
  participantsCount: number;
  completedCount: number; // Count of active participants who submitted current chapter
}

export const CHAPTERS: ChapterDef[] = [
  {
    id: 1,
    title: "O Chamado",
    subtitle: "O início de tudo em Abril de 2024",
    dateLabel: "Abril 2024",
    questions: [
      {
        id: "q1_who",
        label: "Quem era você em Abril de 2024?",
        placeholder: "Pense na sua vida, seus desafios e suas aspirações naquele início de ano...",
        type: "textarea"
      },
      {
        id: "q1_word",
        label: "Escolha uma única palavra que definia seu estado de espírito:",
        placeholder: "Ex: Expectativa, Busca, Coragem...",
        type: "word"
      },
      {
        id: "q1_emotion",
        label: "Escolha uma emoção predominante naquele período:",
        placeholder: "Ex: Ansiedade, Entusiasmo, Incerteza...",
        type: "emotion"
      }
    ]
  },
  {
    id: 2,
    title: "A Aprovação",
    subtitle: "A notícia em Junho de 2024",
    dateLabel: "Junho 2024",
    questions: [
      {
        id: "q2_approved",
        label: "Você foi aprovado. O que mudou em você ao receber essa notícia?",
        placeholder: "Lembre-se do exato momento da confirmação. O que vibrou em você?",
        type: "textarea"
      },
      {
        id: "q2_first_reaction",
        label: "Quem foi a primeira pessoa para quem você contou ou pensou em ligar?",
        placeholder: "Por que essa pessoa era especial nessa conquista?",
        type: "textarea"
      }
    ]
  },
  {
    id: 3,
    title: "As Entrevistas",
    subtitle: "Os momentos de conversa e exposição",
    dateLabel: "Agosto 2024",
    questions: [
      {
        id: "q3_insecurity",
        label: "Qual foi sua maior insegurança durante as etapas de entrevista?",
        placeholder: "Aquele receio íntimo que passou pela sua mente...",
        type: "textarea"
      },
      {
        id: "q3_strength",
        label: "Que força ou valor em si mesmo você redescobriu durante esse processo?",
        placeholder: "O que te fez ver que você realmente merecia estar aqui?",
        type: "textarea"
      }
    ]
  },
  {
    id: 4,
    title: "Primeiro Encontro",
    subtitle: "A conexão inicial do grupo",
    dateLabel: "Outubro 2024",
    questions: [
      {
        id: "q4_who_marked",
        label: "Quem marcou sua caminhada logo no primeiro encontro?",
        placeholder: "Um colega, um facilitador, um gesto ou conversa específica...",
        type: "textarea"
      },
      {
        id: "q4_welcomed",
        label: "Qual olhar, palavra ou abraço te fez sentir que você realmente pertencia ao grupo?",
        placeholder: "Aquele instante de acolhimento que desarmou suas defesas...",
        type: "textarea"
      }
    ]
  },
  {
    id: 5,
    title: "Instituto Caldeira",
    subtitle: "A imersão na inovação e na energia coletiva",
    dateLabel: "Novembro 2024",
    questions: [
      {
        id: "q5_moment",
        label: "Qual momento ou aprendizado no Instituto Caldeira permanece vivo em você?",
        placeholder: "Lembre-se do espaço físico, das discussões ou das conexões daquele dia...",
        type: "textarea"
      },
      {
        id: "q5_vision",
        label: "Como a conexão com aquele ecossistema influenciou sua visão profissional?",
        placeholder: "Que portas se abriram na sua mente em termos de inovação e futuro?",
        type: "textarea"
      }
    ]
  },
  {
    id: 6,
    title: "As Interinidades",
    subtitle: "A liderança na prática cotidiana",
    dateLabel: "Ao Longo de 2025",
    questions: [
      {
        id: "q6_where_led",
        label: "Onde você realmente assumiu a liderança e guiou a transformação?",
        placeholder: "Aquele projeto, desafio ou situação em que você assumiu as rédeas...",
        type: "textarea"
      },
      {
        id: "q6_hardest_decision",
        label: "Qual foi a maior decisão ou superação que revelou sua maturidade?",
        placeholder: "O momento em que você teve que ser firme e acreditar no seu potencial...",
        type: "textarea"
      }
    ]
  },
  {
    id: 7,
    title: "Hoje",
    subtitle: "O ápice do processo de transformação",
    dateLabel: "Hoje",
    questions: [
      {
        id: "q7_became",
        label: "Quem você se tornou após toda essa jornada do Potencializa?",
        placeholder: "Olhe para trás. Quais traços, atitudes e sentimentos mudaram em definitivo?",
        type: "textarea"
      },
      {
        id: "q7_advice",
        label: "Se você pudesse sussurrar um conselho para o seu 'eu' de Abril de 2024, o que diria?",
        placeholder: "Acalme aquele coração do passado com a sabedoria que você tem agora...",
        type: "textarea"
      }
    ]
  },
  {
    id: 8,
    title: "A Experiência",
    subtitle: "A vivência e o impacto no dia seguinte",
    dateLabel: "09 de Julho de 2026",
    questions: [
      {
        id: "q8_experience",
        label: "Como foi sua experiência?",
        placeholder: "Compartilhe como foi vivenciar essa transformação e qual o impacto real no seu dia a dia...",
        type: "textarea"
      }
    ]
  }
];

export function getAvatarSrc(photo: string | undefined, name: string): string {
  if (photo && photo.startsWith('data:image')) {
    return photo;
  }
  
  // Return preset gradient svg as a data URI if it's a preset ID
  if (photo === 'preset-1') {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F27D26"/><stop offset="100%" stop-color="#3a1510"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#g)"/><circle cx="50" cy="50" r="30" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"/><circle cx="50" cy="50" r="15" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2"/></svg>`);
  }
  if (photo === 'preset-2') {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#E0DED7"/><stop offset="100%" stop-color="#F27D26"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#g)"/><polygon points="50,15 62,40 88,40 67,56 75,81 50,65 25,81 33,56 12,40 38,40" fill="rgba(5,5,5,0.15)"/></svg>`);
  }
  if (photo === 'preset-3') {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#10B981"/><stop offset="100%" stop-color="#064E3B"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#g)"/><circle cx="50" cy="50" r="25" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="4" stroke-dasharray="8 4"/></svg>`);
  }
  if (photo === 'preset-4') {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#3B82F6"/><stop offset="100%" stop-color="#1E3A8A"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#g)"/><line x1="15" y1="50" x2="85" y2="50" stroke="rgba(255,255,255,0.25)" stroke-width="4"/><line x1="50" y1="15" x2="50" y2="85" stroke="rgba(255,255,255,0.25)" stroke-width="4"/></svg>`);
  }
  if (photo === 'preset-5') {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#8B5CF6"/><stop offset="100%" stop-color="#4C1D95"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#g)"/><path d="M50 20 C65 20, 75 35, 50 80 C25 35, 35 20, 50 20 Z" fill="rgba(255,255,255,0.15)"/></svg>`);
  }
  if (photo === 'preset-6') {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#EC4899"/><stop offset="100%" stop-color="#9D174D"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#g)"/><rect x="30" y="30" width="40" height="40" rx="6" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="4" transform="rotate(45 50 50)"/></svg>`);
  }

  // Default beautiful dynamic monogram SVG based on user initials
  const initial = (name || '?').charAt(0).toUpperCase();
  const colors = [
    ['#F27D26', '#3a1510'],
    ['#3B82F6', '#1E3A8A'],
    ['#10B981', '#064E3B'],
    ['#8B5CF6', '#4C1D95'],
    ['#EC4899', '#9D174D']
  ];
  const colorIndex = Math.abs(name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length;
  const c = colors[colorIndex];
  
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c[0]}"/><stop offset="100%" stop-color="${c[1]}"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#g)"/><text x="50" y="62" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="34" font-weight="bold">${initial}</text></svg>`);
}

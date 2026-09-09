export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function createSeed() {
  const today = localDate();
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = localDate(tomorrowDate);
  return {
    teams: [
      {
        id: "valorant",
        name: "Valorant",
        short: "VL",
        sub: "Roster principal",
        win: 76,
        players: [
          { name: "zephyr", role: "Duelista" },
          { name: "kaizen", role: "Iniciador" },
          { name: "frost", role: "Controlador" },
          { name: "blade", role: "Centinela" },
          { name: "echo", role: "Flex" },
        ],
      },
      {
        id: "cs2",
        name: "Counter-Strike 2",
        short: "CS",
        sub: "Roster principal",
        win: 68,
        players: [
          { name: "kronos", role: "IGL" },
          { name: "pulse", role: "AWPer" },
          { name: "raven", role: "Entry" },
          { name: "nova", role: "Lurker" },
          { name: "ghost", role: "Support" },
        ],
      },
      {
        id: "lol",
        name: "League of Legends",
        short: "LoL",
        sub: "Roster academia",
        win: 72,
        players: [
          { name: "atlas", role: "Top" },
          { name: "river", role: "Jungla" },
          { name: "zero", role: "Mid" },
          { name: "storm", role: "ADC" },
          { name: "sage", role: "Support" },
        ],
      },
    ],
    events: [
      {
        id: "e1",
        name: "Scrim vs. Leviatán",
        team: "Valorant",
        date: today,
        time: "16:00",
        type: "Entrenamiento",
      },
      {
        id: "e2",
        name: "Revisión de VODs",
        team: "Counter-Strike 2",
        date: today,
        time: "18:00",
        type: "Entrenamiento",
      },
      {
        id: "e3",
        name: "Weekly del staff",
        team: "Organización",
        date: today,
        time: "20:00",
        type: "Reunión",
      },
      {
        id: "e4",
        name: "Nexus vs. KRÜ · Liga Challengers",
        team: "Valorant",
        date: tomorrow,
        time: "19:00",
        type: "Competencia",
      },
    ],
    tasks: [
      {
        id: "t1",
        name: "Confirmar roster para Challengers",
        team: "Valorant",
        who: "Martín",
        due: today,
        priority: true,
        done: false,
      },
      {
        id: "t2",
        name: "Preparar análisis del próximo rival",
        team: "Staff técnico",
        who: "Lucía",
        due: today,
        priority: true,
        done: false,
      },
      {
        id: "t3",
        name: "Revisar piezas para redes",
        team: "Contenido",
        who: "Sofía",
        due: tomorrow,
        priority: false,
        done: false,
      },
      {
        id: "t4",
        name: "Coordinar horarios de scrims",
        team: "Counter-Strike 2",
        who: "Nico",
        due: tomorrow,
        priority: false,
        done: false,
      },
    ],
  };
}

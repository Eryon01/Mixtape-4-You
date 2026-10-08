export const CASSETTES = {
  green: {
    label: "Green Floral",
    front: "/assets/cassettes/green-floral.png",
    back: "/assets/cassettes/back/green-floral-back.png",
  },

  yellow: {
    label: "Yellow Gingham",
    front: "/assets/cassettes/yellow-gingham.png",
    back: "/assets/cassettes/back/yellow-gingham-back.png",
  },

  red: {
    label: "Red Grid",
    front: "/assets/cassettes/red-grid.png",
    back: "/assets/cassettes/back/red-grid-back.png",
  },

  blue: {
    label: "Blue Floral",
    front: "/assets/cassettes/blue-floral.png",
    back: "/assets/cassettes/back/blue-floral-back.png",
  },
};

export const getCassette = (color = "green") => {
  return CASSETTES[color] || CASSETTES.green;
};
const studioOptions = {
  "Graphic Design": [
    "Amend",
    "Deck",
    "Flyer",
    "Poster",
    "Infographic",
    "Branding",
    "Job aid",
    "Brochure",
    "Toolkit",
    "GIF",
    "Book",
    "Mini mag",
    "Image creation/editing",
    "Photography",
    "Quip",
    "One-pager",
    "Other",
  ],
  "RISE/Storyline eLearning": ["eLearning"],
  "Video Production": ["Animation", "Storyboard", "Live-action video"],
  "Audio Production": ["Voiceover", "Podcast/sound editing"],
};

const webdevOptions = {
  "Content Population": ["Blog upload", "Sharepoint"],
  "Web Development": [
    "Microsite",
    "Diagnostic tool",
    "Website amend",
    "Bug fix",
    "Other",
  ],
  "Custom Conversation eLearning": ["Custom Conversation eLearning"],
  Integration: ["Slack bot", "Slack bot amend", "Dashboard", "Dashboard amend"],
};

const createSlackOptionGroup = (options) => {
  return Object.keys(options).reduce((acc, key) => {
    const group = {
      label: {
        type: "plain_text",
        text: key,
        emoji: true,
      },
      options: options[key].map((option) => {
        return {
          text: {
            type: "plain_text",
            text: option,
            emoji: true,
          },
          value: option,
        };
      }),
    };

    acc.push(group);
    return acc;
  }, []);
};

module.exports = {
  // handleStudioRequestResponse: [
  //   "Amend",
  //   "Deck",
  //   "Flyer",
  //   "Poster",
  //   "Infographic",
  //   "Branding",
  //   "Job aid",
  //   "Brochure",
  //   "Toolkit",
  //   "GIF",
  //   "eLearning",
  //   "Book",
  //   "Mini mag",
  //   "Image creation/editing",
  //   "Photography",
  //   "Quip",
  //   "Other",
  // ],
  // handleCommTechRequestResponse: [
  //   "Blog upload",
  //   "Sharepoint",
  //   "Microsite",
  //   "Diagnostic tool",
  //   "Website amend",
  //   "Slack bot amend",
  //   "Bug fix",
  //   "Other",
  // ],
  handleStudioRequestResponse: createSlackOptionGroup(studioOptions),
  handleCommTechRequestResponse: createSlackOptionGroup(webdevOptions),
};

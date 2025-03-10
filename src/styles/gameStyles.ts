// Shared styles for game components
export const gameStyles = {
  // Layout
  container: "min-h-screen py-4 sm:py-6 px-4 flex flex-col relative",
  innerContainer: "max-w-7xl mx-auto w-full flex flex-col  relative",
  contentWrapper: "flex-1 flex flex-col items-center justify-center mt-24 sm:mt-28",

  // Game card
  gameCard: "relative py-3 sm:max-w-xl sm:mx-auto w-full",
  gameCardGradient: "absolute inset-0 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl",
  gameCardInner: "relative px-4 py-10 backdrop-blur-2xl bg-white/40 shadow-lg sm:rounded-3xl sm:p-20 w-full sm:min-w-[500px] border border-white/30",

  // Logos
  numberNinjasLogo: {
    wrapper: "!absolute !top-0 !left-4 sm:!left-6 !mt-4 sm:!mt-6 !z-10",
    image: "!h-16 sm:!h-24 !w-auto"
  },
  mrPrimoLogo: {
    wrapper: "flex justify-center py-4",
    image: "h-8 sm:h-10 w-auto hover:opacity-80 transition-opacity",
    link: "https://mrprimo.org"
  },
  // User menu
  userMenu: {
    wrapper: "absolute top-4 sm:top-6 right-4 sm:right-6 z-10",
    button: "flex items-center space-x-2 focus:outline-none",
    avatar: {
      wrapper: "w-16 h-16 sm:w-20 sm:h-20 relative",
      image: "w-full h-full rounded-full object-cover border-2 border-white/60 shadow-sm",
      placeholder: "w-full h-full rounded-full flex items-center justify-center text-2xl sm:text-3xl text-white font-bold border-2 border-white/60 shadow-sm"
    },
    dropdown: {
      wrapper: "absolute right-0 mt-2 w-48 bg-white/50 backdrop-blur-xl rounded-md shadow-lg py-1 z-20 border border-white/30",
      item: "flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-white/30",
      icon: "w-4 h-4 mr-2"
    }
  },

  // Navigation
  backButton: "flex items-center space-x-2 text-white font-semibold rounded-lg px-4 py-2 shadow-md hover:shadow-lg transition-all duration-200",
  backIcon: "w-5 h-5",

  // Game content
  gameContent: {
    wrapper: "flex-1 flex flex-col items-center w-full",
    startScreen: {
      wrapper: "text-center w-full",
      image: "w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4 sm:mb-8",
      title: "text-2xl sm:text-4xl font-bold text-gray-800 mb-4 sm:mb-8",
      startButton: "px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold shadow-lg transition-colors duration-200 flex items-center space-x-2 mx-auto text-sm sm:text-base"
    },
    gameScreen: {
      wrapper: "w-full max-w-md",
      inner: "backdrop-blur-2xl bg-white/50 rounded-2xl shadow-xl p-4 sm:p-8 border border-white/30",
      content: "text-center",
      equation: "text-4xl sm:text-6xl font-bold text-gray-800 mb-4",
      input: "w-full text-center text-3xl sm:text-4xl font-bold py-2 sm:py-3 border-2 border-gray-300/60 rounded-lg outline-none transition-all bg-white/60 backdrop-blur",
      submitButton: "w-full py-2 sm:py-3 rounded-lg font-semibold transition-colors duration-200"
    },
    progressBar: {
      wrapper: "w-full bg-gray-200/30 backdrop-blur rounded-full h-2 sm:h-3 mb-4 sm:mb-6 overflow-hidden",
      inner: "h-2 sm:h-3 rounded-full transition-all duration-300"
    }
  }
};

// Game-specific colors
export const gameColors = {
  addition: {
    background: "bg-blue-50/30",
    gradient: "bg-gradient-to-r from-blue-400/70 to-blue-600/70 backdrop-blur",
    button: "bg-blue-600/70 hover:bg-blue-700/80 text-white backdrop-blur",
    focus: "focus:border-blue-500/60 focus:ring-2 focus:ring-blue-200/60"
  },
  subtraction: {
    background: "bg-green-50/30",
    gradient: "bg-gradient-to-r from-green-400/70 to-green-600/70 backdrop-blur",
    button: "bg-green-600/70 hover:bg-green-700/80 text-white backdrop-blur",
    focus: "focus:border-green-500/60 focus:ring-2 focus:ring-green-200/60"
  },
  multiplication: {
    background: "bg-purple-50/30",
    gradient: "bg-gradient-to-r from-purple-400/70 to-purple-600/70 backdrop-blur",
    button: "bg-purple-600/70 hover:bg-purple-700/80 text-white backdrop-blur",
    focus: "focus:border-purple-500/60 focus:ring-2 focus:ring-purple-200/60"
  },
  division: {
    background: "bg-orange-50/30",
    gradient: "bg-gradient-to-r from-orange-400/70 to-orange-600/70 backdrop-blur",
    button: "bg-orange-600/70 hover:bg-orange-700/80 text-white backdrop-blur",
    focus: "focus:border-orange-500/60 focus:ring-2 focus:ring-orange-200/60"
  }
};

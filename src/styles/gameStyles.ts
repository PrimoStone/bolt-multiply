// Shared styles for game components
export const gameStyles = {
  // Layout
  container: "min-h-screen py-4 sm:py-6 px-4 flex flex-col relative",
  innerContainer: "max-w-7xl mx-auto w-full flex flex-col min-h-[calc(100vh-2rem)] sm:min-h-[calc(100vh-3rem)] relative",
  contentWrapper: "flex-1 flex flex-col items-center justify-center mt-24 sm:mt-28",

  // Game card
  gameCard: "relative py-3 sm:max-w-xl sm:mx-auto w-full",
  gameCardGradient: "absolute inset-0 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl",
  gameCardInner: "relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20 w-full sm:min-w-[500px]",

  // Logos
  numberNinjasLogo: {
    wrapper: "absolute top-0 left-1/2 transform -translate-x-1/2 mt-4 sm:mt-6 z-10",
    image: "h-12 sm:h-16 w-auto"
  },
  mrPrimoLogo: {
    wrapper: "flex justify-center py-4",
    image: "h-8 sm:h-10 w-auto hover:opacity-80 transition-opacity"
  },

  // User menu
  userMenu: {
    wrapper: "absolute top-4 sm:top-6 right-4 sm:right-6 z-10",
    button: "flex items-center space-x-2 focus:outline-none",
    avatar: {
      wrapper: "w-16 h-16 sm:w-20 sm:h-20 relative",
      image: "w-full h-full rounded-full object-cover border-2 border-white shadow-sm",
      placeholder: "w-full h-full rounded-full flex items-center justify-center text-2xl sm:text-3xl text-white font-bold border-2 border-white shadow-sm"
    },
    dropdown: {
      wrapper: "absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20",
      item: "flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100",
      icon: "w-4 h-4 mr-2"
    }
  },

  // Navigation
  backButton: "absolute top-4 sm:top-6 left-4 sm:left-6 z-10 flex items-center space-x-2 text-gray-600 hover:text-gray-800 bg-white rounded-lg px-4 py-2 shadow-md hover:shadow-lg transition-all duration-200",
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
      inner: "bg-white rounded-2xl shadow-xl p-4 sm:p-8",
      content: "text-center",
      equation: "text-4xl sm:text-6xl font-bold text-gray-800 mb-4",
      input: "w-full text-center text-3xl sm:text-4xl font-bold py-2 sm:py-3 border-2 border-gray-300 rounded-lg outline-none transition-all",
      submitButton: "w-full py-2 sm:py-3 rounded-lg font-semibold transition-colors duration-200"
    },
    progressBar: {
      wrapper: "w-full bg-gray-200 rounded-full h-2 sm:h-3 mb-4 sm:mb-6 overflow-hidden",
      inner: "h-2 sm:h-3 rounded-full transition-all duration-300"
    }
  }
};

// Game-specific colors
export const gameColors = {
  addition: {
    background: "bg-blue-50",
    gradient: "bg-gradient-to-r from-blue-400 to-blue-600",
    button: "bg-blue-600 hover:bg-blue-700 text-white",
    focus: "focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
  },
  subtraction: {
    background: "bg-green-50",
    gradient: "bg-gradient-to-r from-green-400 to-green-600",
    button: "bg-green-600 hover:bg-green-700 text-white",
    focus: "focus:border-green-500 focus:ring-2 focus:ring-green-200"
  },
  multiplication: {
    background: "bg-purple-50",
    gradient: "bg-gradient-to-r from-purple-400 to-purple-600",
    button: "bg-purple-600 hover:bg-purple-700 text-white",
    focus: "focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
  },
  division: {
    background: "bg-orange-50",
    gradient: "bg-gradient-to-r from-orange-400 to-orange-600",
    button: "bg-orange-600 hover:bg-orange-700 text-white",
    focus: "focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
  }
};

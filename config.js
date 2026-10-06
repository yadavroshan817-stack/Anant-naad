/*
  ANANT NAAD - SITE CONFIGURATION
  Edit this file to change playlists, donation details, artwork, timings or quotes.
  No build step is required because this is a static website.

  You may use:
  1) playlistId = a public YouTube playlist ID, OR
  2) videoIds = an array of public YouTube video IDs.

  The current demo uses public YouTube content as embedded playback.
  Replace the IDs with playlists you curate for Anant Naad when ready.
*/

window.ANANT_NAAD_CONFIG = {
  brand: {
    name: "Anant Naad",
    tagline: "Divine Sounds, Anytime",
    creator: "Roshika"
  },

  donation: {
    upiId: "yadavroshan817-1@okhdfcbank",
    qrImage: "assets/upi-qr.png",
    payeeName: "Anant Naad"
  },

  sessions: {
    morning: {
      start: "04:00",
      end: "11:00",
      label: "Morning Blessings",
      subtitle: "Awaken with sacred sound",
      icon: "🌅",
      mood: "Awaken • Chant • Begin",
      deityFocus: ["Hanuman", "Shiva", "Ganesha", "Surya"],
      palette: "sunrise",
      playlistId: "",
      videoIds: [
        "qdJvJH84R3U",
        "YDH_ByxBsfg",
        "IU6NVqHHb0U"
      ]
    },

    afternoon: {
      start: "11:00",
      end: "17:00",
      label: "Afternoon Devotion",
      subtitle: "A calm companion through the day",
      icon: "☀️",
      mood: "Focus • Bhakti • Grace",
      deityFocus: ["Krishna", "Rama", "Vishnu", "Lakshmi", "Saraswati"],
      palette: "daylight",
      playlistId: "",
      videoIds: [
        "igEg25F6Yjc",
        "4k3ZRQ5Hi6c",
        "0F0kWlKblSo"
      ]
    },

    evening: {
      start: "17:00",
      end: "21:00",
      label: "Evening Aarti",
      subtitle: "Light a diya, slow down, listen",
      icon: "🪔",
      mood: "Aarti • Gratitude • Light",
      deityFocus: ["Durga", "Ganesha", "Shiva", "Hanuman", "Kali"],
      palette: "aarti",
      playlistId: "",
      videoIds: [
        "T5rtN6yDfjM",
        "YDH_ByxBsfg",
        "IU6NVqHHb0U"
      ]
    },

    night: {
      start: "21:00",
      end: "04:00",
      label: "Night Meditation",
      subtitle: "Slow devotional sound for quiet hours",
      icon: "🌙",
      mood: "Stillness • Flute • Rest",
      deityFocus: ["Krishna", "Shiva", "Vishnu", "Rama", "Hanuman"],
      palette: "moonlight",
      playlistId: "",
      videoIds: [
        "alKWhs1_6aI",
        "2uN4HQT_FZE",
        "wTXSA558yzk"
      ]
    }
  },

  dailyQuotes: [
    {
      text: "धर्म की रक्षा करने वाला सत्य के मार्ग पर चलता है।",
      translation: "Walk on the path of truth and dharma.",
      source: "Anant Naad • Daily Reflection"
    },
    {
      text: "You have the right to action, but not to the fruits of action.",
      translation: "Let sincere action be your offering.",
      source: "Bhagavad Gita • 2.47"
    },
    {
      text: "श्री राम नाम स्मरण मन को स्थिर और सरल बनाता है।",
      translation: "Remembering Shri Rama brings steadiness to the mind.",
      source: "Devotional Reflection"
    },
    {
      text: "भक्ति में शक्ति है, और शांति में दिशा।",
      translation: "Devotion gives strength; inner peace gives direction.",
      source: "Anant Naad • Daily Reflection"
    },
    {
      text: "ॐ नमः शिवाय",
      translation: "A simple remembrance of Shiva.",
      source: "Shiva Panchakshara"
    },
    {
      text: "जय श्री कृष्ण",
      translation: "May devotion bring joy and clarity.",
      source: "Anant Naad • Daily Reflection"
    }
  ]
};

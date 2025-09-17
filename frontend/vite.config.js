import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // .env फ़ाइलों से एनवायरनमेंट वैरिएबल लोड करें
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // यह सुनिश्चित करता है कि Vite एक सिंगल-पेज एप्लीकेशन की तरह काम करे
    appType: 'spa', 

    plugins: [react()],
    server: {
      proxy: {
        // '/api' से शुरू होने वाले सभी अनुरोधों को प्रॉक्सी किया जाएगा
        '/api': {
          // --- समाधान: यहाँ हार्डकोडेड मान को env वैरिएबल से बदल दिया गया है ---
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:3000',
          changeOrigin: true, // सर्वर साइड पर ऑरिजिन हेडर को बदलने के लिए आवश्यक
        },
      },
    },
  };
});
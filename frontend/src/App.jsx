import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { MusicProvider } from './features/music/context/MusicContext.jsx';
import MusicPage from './features/music/pages/MusicPage.jsx';

function App() {
  return (
    <MusicProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<MusicPage />} />
        </Routes>
      </BrowserRouter>
    </MusicProvider>
  );
}

export default App;

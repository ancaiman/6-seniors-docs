import { Routes, Route, Navigate } from 'react-router-dom';
import Header from '../Header/Header';
import NavMenu from '../NavMenu/NavMenu';
import Footer from '../Footer/Footer';
import Container from 'react-bootstrap/Container';
import MDRenderer from '../MDRenderer/MDRenderer';
import { mdDocsFilesData } from 'src/constants';
import css from './App.module.scss';

function App() {
  return (
    <Container fluid="md" className="wrapper">
      <Header />

      <main className="main">
        <NavMenu className={css.navMenu} />

        <section className={css.mainContainer}>
          <Routes>
            {mdDocsFilesData.map((x) => {
              return (
                <Route
                  key={x.appRoute}
                  path={x.appRoute}
                  element={<MDRenderer mdPageUrl={x.fileUrl} />}
                />
              );
            })}

            <Route
              path="page-another"
              element={<MDRenderer mdContent="Text to test the page content" />}
            />

            <Route
              path="*"
              element={
                <Navigate to={`/${mdDocsFilesData[0].appRoute}`} replace />
              }
            />
          </Routes>
        </section>
      </main>

      <Footer />
    </Container>
  );
}

export default App;

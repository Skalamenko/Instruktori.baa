import { useEffect, useReducer, useState } from 'react';
import axios from 'axios';
import logger from 'use-reducer-logger';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Tutorial from '../components/Tutorial';
import { Helmet } from 'react-helmet-async';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';
//import data from '../data';

const reducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true };
    case 'FETCH_SUCCESS':
      return { ...state, tutorials: action.payload, loading: false };
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

function HomeScreen() {
  const [{ loading, error, tutorials }, dispatch] = useReducer(
    logger(reducer),
    {
      tutorials: [],
      loading: true,
      error: '',
    }
  );
  // const [tutorials, setTutorials] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: 'FETCH_REQUEST' });
      try {
        const result = await axios.get('/api/tutorials');
        dispatch({ type: 'FETCH_SUCCESS', payload: result.data });
      } catch (err) {
        dispatch({ type: 'FETCH_FAIL', payload: err.message });
      }

      // setTutorials(result.data);
    };
    fetchData();
  }, []);
  return (
    <div>
      <Helmet>
        <title>Instruktori.ba</title>
      </Helmet>
      <h1>Featured Tutorials</h1>
      <div className="tutorials">
        {loading ? (
          <LoadingBox />
        ) : error ? (
          <MessageBox variant="danger">{error}</MessageBox>
        ) : (
          <Row>
            {tutorials.map((product) => (
              <Col key={product.slug} sm={6} md={4} lg={3} className="mb-3">
                <Tutorial product={product}></Tutorial>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
}
export default HomeScreen;

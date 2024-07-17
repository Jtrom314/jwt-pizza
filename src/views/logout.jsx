import React from 'react';
import { useNavigate } from 'react-router-dom';
import { pizzaService } from '../service/service';
import View from './view';

export default function Logout({ setUser }) {
  const navigate = useNavigate();

  React.useEffect(() => {
    (async () => {
      await pizzaService.logout();
      setUser(null);
      navigate('/');
    })();
  }, []);

  return (
    <View title='Logout'>
      <div className='text-neutral-100'>Logging out ...</div>
    </View>
  );
}

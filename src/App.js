import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import Main from './Components/Main'; // Importing Main.js file

const App = () => {
  return (
    <NavigationContainer>
      <Main /> {/* Calling the Main.js file */}
    </NavigationContainer>
  );
};

export default App;

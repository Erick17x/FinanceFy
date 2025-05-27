import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const Stack = createNativeStackNavigator();

function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.appName}>Fynance</Text>
      <Text style={styles.subtitle}>Organize sua vida financeira</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Login')}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.secondaryButtonText}>Criar Conta</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => alert('Suporte e ajuda')}>
        <Text style={styles.link}>Ajuda</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Bem-Vindo</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        placeholderTextColor="#777"
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
        placeholderTextColor="#777"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          if (username === '' || senha === '') {
            alert('Preencha todos os campos!');
          } else {
            navigation.navigate('Dashboard');
          }
        }}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Entrar com biometria</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Home')}>
        <Text style={styles.link}>Voltar para início</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function SignupScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [dataNasc, setDataNasc] = useState('');
  const [senha, setSenha] = useState('');
  const [confSenha, setConfSenha] = useState('');

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Criar Conta</Text>

      <TextInput
        style={styles.input}
        placeholder="Nome Completo"
        value={nome}
        onChangeText={setNome}
        placeholderTextColor="#777"
      />

      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        placeholderTextColor="#777"
      />

      <TextInput
        style={styles.input}
        placeholder="Telefone"
        value={telefone}
        onChangeText={setTelefone}
        placeholderTextColor="#777"
      />

      <TextInput
        style={styles.input}
        placeholder="Data de Nascimento"
        value={dataNasc}
        onChangeText={setDataNasc}
        placeholderTextColor="#777"
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
        placeholderTextColor="#777"
      />

      <TextInput
        style={styles.input}
        placeholder="Confirmar Senha"
        secureTextEntry
        value={confSenha}
        onChangeText={setConfSenha}
        placeholderTextColor="#777"
      />

      <Text style={styles.terms}>
        Para continuar, aceite os termos de uso.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          if (
            username === '' ||
            nome === '' ||
            telefone === '' ||
            dataNasc === '' ||
            senha === '' ||
            confSenha === ''
          ) {
            alert('Preencha todos os campos!');
          } else if (senha !== confSenha) {
            alert('As senhas não coincidem!');
          } else {
            navigation.navigate('Dashboard');
          }
        }}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Home')}>
        <Text style={styles.link}>Voltar para início</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function DashboardScreen({ navigation }) {
  const [showBalance, setShowBalance] = useState(true);
  const toggleBalance = () => setShowBalance(!showBalance);

  return (
    <SafeAreaView style={styles.dashboardContainer}>
      <ScrollView contentContainerStyle={styles.dashboardScrollContent}>
        <View style={styles.header}>
          <Text style={styles.hello}>Olá, Usuário 👋</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Text style={styles.logout}>Sair</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceTitle}>Saldo disponível</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.balance}>
              {showBalance ? 'R$ 4.200,50' : '••••••••'}
            </Text>
            <TouchableOpacity onPress={toggleBalance}>
              <Text style={{ marginLeft: 10, fontSize: 18 }}>
                {showBalance ? '👁️' : '🙈'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CORRIGIDO: flex styles agora estão em contentContainerStyle */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.actionsRow}
        >
          {['Transações', 'Controle de Orçamento', 'Planej. Financeiro', 'Meta'].map((action) => (
            <TouchableOpacity key={action} style={styles.actionButton}>
              <Text style={styles.actionText}>{action}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['Instituições Financeiras', 'Crédito e Débito', 'Seguro'].map(
            (service) => (
              <TouchableOpacity key={service} style={styles.serviceCard}>
                <Text style={styles.serviceText}>{service}</Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>

        <View style={styles.extraServices}>
          <TouchableOpacity style={styles.extraItem}>
            <Text style={styles.extraTitle}>Dashboard</Text>
            <Text style={styles.extraDesc}>
              Veja seu relatório aqui!.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.extraItem}>
            <Text style={styles.extraTitle}>Indique e ganhe</Text>
            <Text style={styles.extraDesc}>
              Compartilhe o Fynance com amigos e ganhe benefícios.
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  // Usado em SafeAreaView nas telas normais
  container: {
    flex: 1,
    backgroundColor: '#00cba9',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Usado em ScrollView das telas de formulário
  scrollContainer: {
    flex: 1,
    backgroundColor: '#00cba9',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  // Dashboard container e scroll content
  dashboardContainer: {
    flex: 1,
    backgroundColor: '#00cba9',
  },
  dashboardScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
    color: '#111',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: '#e6f4ee',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    color: '#000',
  },
  button: {
    backgroundColor: '#00a886',
    padding: 15,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#d9f0ea',
    padding: 12,
    borderRadius: 15,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryButtonText: {
    color: '#111',
    fontWeight: '600',
  },
  link: {
    color: '#007e6a',
    fontWeight: '600',
    marginTop: 10,
  },
  terms: {
    marginBottom: 10,
    fontSize: 12,
    color: '#222',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  hello: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    paddingTop: 48,
  },
  logout: {
    color: '#fff',
    fontSize: 16,
    paddingTop: 48,
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  balanceTitle: {
    color: '#777',
    fontSize: 16,
    marginBottom: 5,
  },
  balance: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginRight: 20,
  },
  actionButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 15,
    alignItems: 'center',
    width: '23%',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
    marginRight: 20,
  },
  actionText: {
    fontSize: 14,
    color: '#111',
    textAlign: 'center',
  },
  serviceCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    marginRight: 20,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
    height: 100,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  serviceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    textAlign: 'center',
  },
  extraServices: {
    gap: 15,
  },
  extraItem: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  extraTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 5,
  },
  extraDesc: {
    color: '#555',
    fontSize: 14,
  },
});

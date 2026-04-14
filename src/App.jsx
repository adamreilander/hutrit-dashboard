import { useState } from 'react'
import Landing from './pages/Landing'
import AgenteSEO from './pages/AgenteSEO'
import AgenteMarketing from './pages/AgenteMarketing'
import AgenteVentas from './pages/AgenteVentas'
import HutritCTA from './pages/HutritCTA'
import GraciasScreen from './pages/GraciasScreen'

export default function App() {
  const [screen, setScreen] = useState('landing')
  const [ctaAgent, setCtaAgent] = useState(null)

  const goToCTA = (agentId) => {
    setCtaAgent(agentId)
    setScreen('cta')
  }

  switch (screen) {
    case 'landing':   return <Landing onSelect={setScreen} />
    case 'seo':       return <AgenteSEO onDone={() => goToCTA('seo')} onBack={() => setScreen('landing')} />
    case 'marketing': return <AgenteMarketing onDone={() => setScreen('gracias')} onBack={() => setScreen('landing')} />
    case 'ventas':    return <AgenteVentas onDone={() => goToCTA('ventas')} onBack={() => setScreen('landing')} />
    case 'cta':       return <HutritCTA agent={ctaAgent} onBack={() => setScreen('landing')} />
    case 'gracias':   return <GraciasScreen onContinue={() => goToCTA('marketing')} />
    default:          return <Landing onSelect={setScreen} />
  }
}

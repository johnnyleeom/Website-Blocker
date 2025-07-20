import BlockedSites from './BlockedSites';
import PomodoroTimer from "./PomodoroTimer";

export default function Dashboard() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px',
            minHeight: '100vh',
            justifyContent: 'space-between'
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%'
            }}>
                <h2 style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                    fontSize: '28px',
                    fontWeight: '600',
                    color: '#333',
                    margin: '0 0 20px 0',
                    textAlign: 'center'
                }}>
                    FocusShield
                </h2>
                <BlockedSites></BlockedSites>
            </div>
            
            <div style={{
                marginTop: 'auto',
                width: '100%',
                display: 'flex',
                justifyContent: 'center'
            }}>
                <PomodoroTimer></PomodoroTimer>
            </div>
        </div>
    )
}
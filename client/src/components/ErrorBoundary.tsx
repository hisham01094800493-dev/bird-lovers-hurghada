import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: Error): State { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) { console.error("[Bird Lovers UI Error]", error, info); }
  retry = () => this.setState({ hasError: false, error: null });
  render() {
    if (!this.state.hasError) return this.props.children;
    return <div className="error-screen"><div className="error-card"><span className="error-icon"><AlertTriangle size={30} /></span><p className="eyebrow">Bird Lovers / حدث غير متوقع</p><h1>We hit a small snag.</h1><p className="error-copy">لم نتمكن من فتح هذه الصفحة الآن. جرّب إعادة عرضها أو العودة للرئيسية، وستبقى بياناتك محفوظة.</p><div className="error-actions"><button type="button" className="cta-primary" onClick={this.retry}><RotateCcw size={16} /> Try again / إعادة المحاولة</button><a href="/" className="cta-secondary"><Home size={16} /> Home / الرئيسية</a></div><details className="error-details"><summary>Technical details</summary><pre>{this.state.error?.stack || this.state.error?.message}</pre></details></div></div>;
  }
}

export default ErrorBoundary;

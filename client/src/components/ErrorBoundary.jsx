import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
  }
  static getDerivedStateFromError(err) { return { err }; }
  render() {
    if (this.state.err) {
      return (
        <div className="form-page" style={{ textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <p className="muted">{this.state.err.message}</p>
          <button className="btn ghost" onClick={() => { this.setState({ err: null }); window.location.reload(); }}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

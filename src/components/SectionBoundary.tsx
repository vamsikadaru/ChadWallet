"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  label?: string;
}
interface State {
  hasError: boolean;
}

/** Isolates a section so one failing area doesn't take down the page. */
export default class SectionBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error(`[${this.props.label ?? "section"}]`, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass flex flex-col items-center justify-center gap-2 p-8 text-center">
          <AlertTriangle className="text-danger" size={22} />
          <p className="text-[14px] font-medium text-text-1">
            Couldn&apos;t load {this.props.label ?? "this section"}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="caps mt-1 rounded-[var(--radius-pill)] border border-border px-3 py-1.5 text-text-2 transition-colors hover:text-text-1"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

'use client';

// This module is always loaded with { ssr: false }, so all browser APIs are safe here.
// We configure the loader to use the locally installed monaco-editor package instead of
// the default jsDelivr CDN, which is blocked by the project's Content-Security-Policy.
import Editor from '@monaco-editor/react';
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

loader.config({ monaco });

export default Editor;

/**
 * Main content component with Talker and Settings sections
 */

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TalkerTab } from '@/components/talker/TalkerTab';
import { SettingsTab } from '@/components/settings/SettingsTab';
import { useTalkerStore } from '@/stores/talkerStore';
import { TTS_LANGUAGE_MAPPINGS } from '@/constants';
import type { TTSLanguage } from '@/shared/types';

type ActiveSection = 'talker' | 'settings' | null;

/**
 * Converts a TTS language code to full uppercase name (e.g., 'en-us' -> 'ENGLISH (US)', 'de' -> 'GERMAN')
 * @param language - The TTS language code
 * @returns The uppercase language name for display
 */
function getTargetLanguageName(language: TTSLanguage): string {
  const mapping = TTS_LANGUAGE_MAPPINGS[language];
  return mapping ? mapping.name.toUpperCase() : language.toUpperCase();
}

/**
 * Converts a source language name to full uppercase (e.g., 'english' -> 'ENGLISH', 'german' -> 'GERMAN')
 * @param language - The source language name
 * @returns The uppercase language name for display
 */
function getSourceLanguageName(language: string): string {
  return language.toUpperCase();
}

export function MainContent() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('talker');
  const { targetLanguage, sourceLanguage } = useTalkerStore();
  const targetName = getTargetLanguageName(targetLanguage);
  const sourceName = getSourceLanguageName(sourceLanguage);
  const languageLabel = `${sourceName}|${targetName}`;

  return (
    <div className="space-y-4 flex flex-col flex-1">
      {/* Talker and Settings Toggle Buttons - Same Row */}
      <div className="flex gap-2">
        <Button
          variant={activeSection === 'talker' ? 'default' : 'ghost'}
          className="flex-1 justify-center p-2 h-auto"
          onClick={() => setActiveSection(activeSection === 'talker' ? null : 'talker')}
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm font-medium sm:inline hidden">Talker</span>
          </div>
        </Button>

        <Button
          variant={activeSection === 'settings' ? 'default' : 'ghost'}
          className="flex-1 justify-center p-2 h-auto"
          onClick={() => setActiveSection(activeSection === 'settings' ? null : 'settings')}
        >
          <span className="text-sm font-medium">
            {languageLabel}
          </span>
        </Button>
      </div>

      {/* Talker Section - Show/Hide */}
      {activeSection === 'talker' && (
        <div className="bg-card flex flex-col flex-1 rounded-lg sm:mx-4">
          <TalkerTab />
        </div>
      )}

      {/* Settings Section - Show/Hide */}
      {activeSection === 'settings' && (
        <div>
          <SettingsTab />
        </div>
      )}
    </div>
  );
}

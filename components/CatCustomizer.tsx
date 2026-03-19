import React, { Fragment, useState, useRef, useMemo, useCallback, useLayoutEffect, useId } from 'react';
import { useMatteCatUrl } from '../hooks/useMatteCatUrl';
import { useCatAssetObjectUrl } from '../hooks/useCatAssetObjectUrl';
import { catAssetDbHolder, getCatSprite } from '../services/catAssetStore';
import { generateCustomCat } from '../services/geminiService';
import type { CatGenerateErrorCode } from '../types/catGenerateApi';
import type { Outfit, SavedCatLook } from '../types';
import type { MattedCatMattingState } from './MatteCatImage';

function closetMessageForGenerateError(code: CatGenerateErrorCode): string {
  switch (code) {
    case 'BAD_REQUEST':
      return 'Add a short description of your beach kitty first!';
    case 'CONFIG_ERROR':
      return 'Custom cats are not available on this server yet. Ask the host to set GEMINI_API_KEY.';
    case 'NO_IMAGE':
      return 'No image came back—try a simpler or shorter description.';
    case 'MODEL_BLOCKED':
    case 'PROMPT_BLOCKED':
      return 'That description was blocked—try different wording (keep it family-friendly).';
    case 'RATE_LIMITED':
      return 'Whoa, slow down! Too many generations—try again in a minute.';
    case 'REQUEST_TIMEOUT':
      return 'That took too long. Try a shorter description or try again.';
    case 'API_ERROR':
      return 'Connection hiccup. Try again in a moment.';
    case 'SERVER_ERROR':
      return 'Server had a problem. Try again in a bit.';
    default:
      return 'Oops! The litter box got messy. Try again?';
  }
}

type CatCustomizerIndexedProps = {
  mode: 'indexed';
  storageReady: boolean;
  currentEquippedAssetId: string | null;
  currentDisplayUrl: string | null;
  /** App-level matting for equipped cat — reuse when preview matches equipped (avoids a second hook). */
  equippedMatted?: MattedCatMattingState;
  savedLooks: SavedCatLook[];
  ingestClosetDataUrl: (
    dataUrl: string,
    displayName: string,
    existingLooks: SavedCatLook[],
    options?: { mattedOnServer?: boolean }
  ) => Promise<SavedCatLook>;
  onSave: (
    args: { playerDisplayName: string },
    equip: { type: 'dataUrl'; url: string } | { type: 'assetId'; assetId: string } | null,
    looks: SavedCatLook[]
  ) => void | Promise<void>;
  /** Persist closet row removal + delete sprite blob immediately (keeps IDB aligned with UI). */
  onClosetLookDelete: (nextLooks: SavedCatLook[], deletedAssetId: string) => Promise<void>;
  onCancel: () => void;
  /** Hall of Fame / title screen name (separate from closet look labels). */
  playerDisplayName: string;
};

type CatCustomizerLegacyProps = {
  mode: 'legacy';
  currentUrl: string | null;
  currentName: string;
  savedOutfits: Outfit[];
  onSave: (name: string, url: string | null, outfits: Outfit[]) => void;
  onCancel: () => void;
};

type CatCustomizerProps = CatCustomizerIndexedProps | CatCustomizerLegacyProps;

function CatCustomizerLegacy(props: CatCustomizerLegacyProps) {
  const [description, setDescription] = useState('');
  const [name, setName] = useState(props.currentName);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Tell me how your beach kitty should look!');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(props.currentUrl);
  const [previewMattedOnServer, setPreviewMattedOnServer] = useState(false);
  const [outfits, setOutfits] = useState<Outfit[]>(props.savedOutfits);
  const { displayUrl: mattedPreview, isProcessing: isMattingPreview } = useMatteCatUrl(previewUrl, {
    alreadyMatted: previewMattedOnServer,
  });

  const handleGenerate = async () => {
    if (!description.trim()) return;
    setIsGenerating(true);
    setStatusMsg('Polishing the claws and prepping the fur...');
    const result = await generateCustomCat(description);
    if (result.ok === false) {
      setStatusMsg(closetMessageForGenerateError(result.code));
      setPreviewMattedOnServer(false);
    } else {
      setPreviewUrl(result.imageDataUrl);
      setPreviewMattedOnServer(result.meta.mattedOnServer === true);
      setStatusMsg('Wow! You look paws-itively stunning!');
    }
    setIsGenerating(false);
  };

  const saveOutfit = () => {
    if (!previewUrl) return;
    const cleanName = name.trim() || 'Unnamed Outfit';
    setOutfits((prev) => [...prev, { id: Date.now().toString(), name: cleanName, url: previewUrl }]);
    setStatusMsg('Outfit saved to your collection!');
  };

  const selectOutfit = (outfit: Outfit) => {
    setPreviewUrl(outfit.url);
    setPreviewMattedOnServer(false);
    setName(outfit.name);
    setStatusMsg(`Selected ${outfit.name}!`);
  };

  const deleteOutfit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOutfits((prev) => prev.filter((o) => o.id !== id));
  };

  return (
    <CustomizerShell
      statusMsg={statusMsg}
      name={name}
      setName={setName}
      nameFieldLabel="Kitty Name"
      nameFieldPlaceholder="Enter kitty name..."
      description={description}
      setDescription={setDescription}
      isGenerating={isGenerating}
      handleGenerate={handleGenerate}
      nameInputRef={nameInputRef}
      previewNode={
        <LegacyPreviewBox
          previewUrl={previewUrl}
          mattedPreview={mattedPreview}
          isMattingPreview={isMattingPreview}
          isGenerating={isGenerating}
        />
      }
      saveOutfitSlot={
        <button
          type="button"
          onClick={saveOutfit}
          disabled={!previewUrl}
          className="flex-grow min-h-[48px] bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 text-white font-black py-4 rounded-2xl uppercase tracking-widest transition-all shadow-md active:scale-95"
        >
          Save Look to Closet
        </button>
      }
      collectionNode={
        outfits.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {outfits.map((outfit) => (
              <div
                key={outfit.id}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && selectOutfit(outfit)}
                onClick={() => selectOutfit(outfit)}
                className="group relative aspect-square bg-white rounded-2xl border-2 border-white hover:border-amber-400 transition-all cursor-pointer shadow-sm overflow-hidden"
              >
                <img
                  src={outfit.url}
                  alt={outfit.name}
                  className="w-full h-full object-contain p-2"
                  style={{ mixBlendMode: 'multiply' }}
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <span className="text-[10px] text-white font-black uppercase truncate w-full">{outfit.name}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => deleteOutfit(outfit.id, e)}
                  aria-label={`Delete look ${outfit.name}`}
                  className="absolute top-1 right-1 min-h-[44px] min-w-[44px] -m-2 p-0 flex items-center justify-center bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity hover:bg-red-600 shadow-md text-lg font-black leading-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyCollection />
        )
      }
      footerNode={
        <>
          <button
            type="button"
            onClick={props.onCancel}
            className="flex-grow min-h-[48px] bg-slate-100 hover:bg-slate-200 text-slate-500 font-black py-4 rounded-2xl uppercase tracking-widest transition-all"
          >
            Discard Changes
          </button>
          <button
            type="button"
            onClick={() => props.onSave(name.trim(), previewUrl, outfits)}
            className="flex-grow min-h-[48px] bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest transition-all shadow-lg shadow-green-200"
          >
            Equip & Exit
          </button>
        </>
      }
    />
  );
}

function WardrobeThumbIndexed({
  look,
  storageReady,
  onSelect,
  onDelete,
  isEquipped = false,
}: {
  look: SavedCatLook;
  storageReady: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  isEquipped?: boolean;
}) {
  const thumbUrl = useCatAssetObjectUrl(look.assetId, storageReady);
  const { displayUrl: mattedThumb, isProcessing: thumbMatting } = useMatteCatUrl(thumbUrl, {
    alreadyMatted: look.mattedOnServer === true,
  });
  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      onClick={onSelect}
      className="group relative aspect-square bg-white rounded-2xl border-2 border-white hover:border-amber-400 transition-all cursor-pointer shadow-sm overflow-hidden"
    >
      {isEquipped && (
        <span className="absolute top-1 left-1 z-20 text-[9px] font-black uppercase tracking-wide bg-amber-500 text-white px-1.5 py-0.5 rounded-md shadow">
          Equipped
        </span>
      )}
      {thumbUrl ? (
        <div className="relative w-full h-full">
          <img
            src={mattedThumb || thumbUrl}
            alt={look.name}
            className={`w-full h-full object-contain p-2 transition-opacity duration-150 ${thumbMatting && !mattedThumb ? 'opacity-0' : 'opacity-100'}`}
          />
          {thumbMatting && !mattedThumb && (
            <div className="absolute inset-0 flex items-center justify-center bg-amber-50/90">
              <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-2xl opacity-40">🐾</div>
      )}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
        <span className="text-[10px] text-white font-black uppercase truncate w-full">{look.name}</span>
      </div>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete look ${look.name}`}
        className="absolute top-1 right-1 min-h-[44px] min-w-[44px] -m-2 p-0 flex items-center justify-center bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity hover:bg-red-600 shadow-md text-lg font-black leading-none"
      >
        ×
      </button>
    </div>
  );
}

const CatCustomizer: React.FC<CatCustomizerProps> = (props) => {
  if (props.mode === 'legacy') {
    return <CatCustomizerLegacy {...props} />;
  }

  const {
    storageReady,
    currentEquippedAssetId,
    currentDisplayUrl,
    equippedMatted,
    savedLooks: initialLooks,
    ingestClosetDataUrl,
    onSave,
    onClosetLookDelete,
    onCancel,
    playerDisplayName,
  } = props;

  const initialSnapshotRef = useRef({
    player: playerDisplayName,
    looksJson: JSON.stringify(
      initialLooks.map((l) => ({ id: l.id, assetId: l.assetId, name: l.name }))
    ),
  });

  const [description, setDescription] = useState('');
  const [playerName, setPlayerName] = useState(playerDisplayName);
  const [lookName, setLookName] = useState(() => {
    const eq = initialLooks.find((l) => l.assetId === currentEquippedAssetId);
    return eq?.name ?? '';
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Tell me how your beach kitty should look!');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const playerInputRef = useRef<HTMLInputElement>(null);

  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [previewAssetId, setPreviewAssetId] = useState<string | null>(currentEquippedAssetId);
  const [lastGenerateMatted, setLastGenerateMatted] = useState(false);
  const [looks, setLooks] = useState<SavedCatLook[]>(initialLooks);

  const needsOtherAssetBlob =
    !previewDataUrl &&
    !!previewAssetId &&
    previewAssetId !== currentEquippedAssetId;
  const otherLookObjectUrl = useCatAssetObjectUrl(
    needsOtherAssetBlob ? previewAssetId : null,
    storageReady
  );
  const previewRawUrl =
    previewDataUrl ?? (needsOtherAssetBlob ? otherLookObjectUrl : currentDisplayUrl);

  const previewClosetLook =
    previewAssetId && !previewDataUrl ? looks.find((l) => l.assetId === previewAssetId) : undefined;
  const previewAlreadyMatted =
    Boolean(previewDataUrl && lastGenerateMatted) || previewClosetLook?.mattedOnServer === true;

  const useEquippedMattedFromApp =
    Boolean(equippedMatted) &&
    !previewDataUrl &&
    previewAssetId === currentEquippedAssetId &&
    Boolean(currentDisplayUrl);

  const { displayUrl: localMatted, isProcessing: localMatting } = useMatteCatUrl(
    useEquippedMattedFromApp ? null : previewRawUrl,
    { alreadyMatted: !useEquippedMattedFromApp && previewAlreadyMatted }
  );
  const mattedIndexed = useEquippedMattedFromApp ? equippedMatted!.displayUrl : localMatted;
  const isMattingIndexed = useEquippedMattedFromApp ? equippedMatted!.isProcessing : localMatting;

  const previewBadge = useMemo((): string | null => {
    if (previewDataUrl) return 'New · not saved';
    if (previewAssetId && previewAssetId === currentEquippedAssetId) return 'Equipped';
    if (previewAssetId && looks.some((l) => l.assetId === previewAssetId)) return 'Saved';
    return null;
  }, [previewDataUrl, previewAssetId, currentEquippedAssetId, looks]);

  const isDirty = useMemo(() => {
    if (previewDataUrl) return true;
    if (playerName.trim() !== initialSnapshotRef.current.player.trim()) return true;
    const now = JSON.stringify(looks.map((l) => ({ id: l.id, assetId: l.assetId, name: l.name })));
    return now !== initialSnapshotRef.current.looksJson;
  }, [previewDataUrl, playerName, looks]);

  const requestCancel = useCallback(() => {
    if (isDirty && !window.confirm('Discard unsaved closet changes?')) return;
    onCancel();
  }, [isDirty, onCancel]);

  const handleGenerateIndexed = async () => {
    if (!description.trim()) return;
    setIsGenerating(true);
    setStatusMsg('Polishing the claws and prepping the fur...');
    const result = await generateCustomCat(description);
    if (result.ok === false) {
      setStatusMsg(closetMessageForGenerateError(result.code));
      setLastGenerateMatted(false);
    } else {
      setPreviewDataUrl(result.imageDataUrl);
      setPreviewAssetId(null);
      setLastGenerateMatted(result.meta.mattedOnServer === true);
      setStatusMsg('Wow! You look paws-itively stunning!');
    }
    setIsGenerating(false);
  };

  const saveOutfitIndexed = async () => {
    const cleanName = lookName.trim() || 'Unnamed Outfit';
    try {
      if (previewDataUrl) {
        const row = await ingestClosetDataUrl(previewDataUrl, cleanName, looks, {
          mattedOnServer: lastGenerateMatted,
        });
        if (looks.some((l) => l.assetId === row.assetId)) {
          setStatusMsg('That look is already in your closet.');
          return;
        }
        setLooks((prev) => [...prev, row]);
        setStatusMsg('Outfit saved to your collection!');
        return;
      }
      if (previewAssetId) {
        if (looks.some((l) => l.assetId === previewAssetId)) {
          setStatusMsg('That look is already in your closet.');
          return;
        }
        const dataUrl = await blobToDataUrlFromAsset(previewAssetId);
        const row = await ingestClosetDataUrl(dataUrl, cleanName, looks, {
          mattedOnServer: previewClosetLook?.mattedOnServer === true,
        });
        if (looks.some((l) => l.assetId === row.assetId)) {
          setStatusMsg('That look is already in your closet.');
          return;
        }
        setLooks((prev) => [...prev, row]);
        setStatusMsg('Outfit saved to your collection!');
      }
    } catch (e) {
      console.error('[CatCustomizer] save outfit', e);
      setStatusMsg('Could not save to closet. Try again.');
    }
  };

  const selectLook = (look: SavedCatLook) => {
    setPreviewAssetId(look.assetId);
    setPreviewDataUrl(null);
    setLastGenerateMatted(false);
    setLookName(look.name);
    setStatusMsg(`Selected ${look.name}!`);
  };

  const deleteLook = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const removed = looks.find((o) => o.id === id);
    if (!removed) return;

    const previousLooks = looks;
    const nextLooks = looks.filter((o) => o.id !== id);
    const deletedWasEquipped = removed.assetId === currentEquippedAssetId;
    const previewWasDeleted = removed.assetId === previewAssetId;
    const nextEquippedId = deletedWasEquipped ? null : currentEquippedAssetId;

    setLooks(nextLooks);

    try {
      await onClosetLookDelete(nextLooks, removed.assetId);
    } catch (err) {
      console.error('[CatCustomizer] closet delete persist', err);
      setLooks(previousLooks);
      setStatusMsg('Could not remove that look from storage. Try again.');
      return;
    }

    initialSnapshotRef.current.looksJson = JSON.stringify(
      nextLooks.map((l) => ({ id: l.id, assetId: l.assetId, name: l.name }))
    );

    if (deletedWasEquipped) {
      setPreviewDataUrl(null);
      setPreviewAssetId(null);
      setLookName('');
      setLastGenerateMatted(false);
      setStatusMsg('Equipped look removed — choose another saved look or generate a new one.');
      return;
    }

    if (previewWasDeleted) {
      setPreviewDataUrl(null);
      setPreviewAssetId(nextEquippedId);
      setLastGenerateMatted(false);
      const eq = nextEquippedId ? nextLooks.find((l) => l.assetId === nextEquippedId) : undefined;
      setLookName(eq?.name ?? '');
      setStatusMsg(
        nextEquippedId
          ? 'Removed from closet — preview reset to your equipped look.'
          : 'Removed from closet — pick another look or generate a new one.'
      );
    } else {
      setStatusMsg(`Removed ${removed.name} from your closet.`);
    }
  };

  const canSaveToCloset = Boolean(previewDataUrl || previewAssetId);

  const previewSuccessHighlight = useMemo(
    () => /paws-itively stunning|saved to your collection|already in your closet/i.test(statusMsg),
    [statusMsg]
  );

  const equipPayload = useMemo(() => {
    if (previewDataUrl) return { type: 'dataUrl' as const, url: previewDataUrl };
    if (previewAssetId) return { type: 'assetId' as const, assetId: previewAssetId };
    return null;
  }, [previewDataUrl, previewAssetId]);

  return (
    <CustomizerShell
      statusMsg={statusMsg}
      name={lookName}
      setName={setLookName}
      nameFieldLabel="Look name (closet)"
      nameFieldPlaceholder="Name for this outfit in your closet..."
      playerName={playerName}
      setPlayerName={setPlayerName}
      playerFieldLabel="Player name"
      playerFieldPlaceholder="Name shown in Hall of Fame..."
      description={description}
      setDescription={setDescription}
      isGenerating={isGenerating}
      handleGenerate={handleGenerateIndexed}
      nameInputRef={nameInputRef}
      playerInputRef={playerInputRef}
      previewNode={
        <IndexedPreviewBox
          previewRawUrl={previewRawUrl}
          mattedIndexed={mattedIndexed}
          isMattingIndexed={isMattingIndexed}
          isGenerating={isGenerating}
          badge={previewBadge}
          successHighlight={previewSuccessHighlight}
        />
      }
      saveOutfitSlot={
        <button
          type="button"
          onClick={() => void saveOutfitIndexed()}
          disabled={!canSaveToCloset}
          className="flex-grow min-h-[48px] bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 text-white font-black py-4 rounded-2xl uppercase tracking-widest transition-all shadow-md active:scale-95"
        >
          Save Look to Closet
        </button>
      }
      collectionNode={
        looks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {looks.map((savedLook) => (
              <Fragment key={savedLook.id}>
                <WardrobeThumbIndexed
                  look={savedLook}
                  storageReady={storageReady}
                  isEquipped={savedLook.assetId === currentEquippedAssetId}
                  onSelect={() => selectLook(savedLook)}
                  onDelete={(e) => void deleteLook(savedLook.id, e)}
                />
              </Fragment>
            ))}
          </div>
        ) : (
          <EmptyCollection />
        )
      }
      footerNode={
        <>
          <button
            type="button"
            onClick={requestCancel}
            className="flex-grow min-h-[48px] bg-slate-100 hover:bg-slate-200 text-slate-500 font-black py-4 rounded-2xl uppercase tracking-widest transition-all"
          >
            Discard Changes
          </button>
          <button
            type="button"
            onClick={() =>
              void onSave({ playerDisplayName: playerName.trim() || playerDisplayName }, equipPayload, looks)
            }
            className="flex-grow min-h-[48px] bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest transition-all shadow-lg shadow-green-200"
          >
            Equip & Exit
          </button>
        </>
      }
    />
  );
};

async function blobToDataUrlFromAsset(assetId: string): Promise<string> {
  const db = catAssetDbHolder.db;
  if (!db) throw new Error('No asset DB');
  const blob = await getCatSprite(db, assetId);
  if (!blob) throw new Error('Asset missing');
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

function LegacyPreviewBox({
  previewUrl,
  mattedPreview,
  isMattingPreview,
  isGenerating,
}: {
  previewUrl: string | null;
  mattedPreview: string | null;
  isMattingPreview: boolean;
  isGenerating: boolean;
}) {
  return (
    <div className="w-48 h-48 flex-shrink-0 bg-amber-50 rounded-[2rem] border-4 border-amber-200 shadow-inner flex items-center justify-center overflow-hidden relative group">
      {previewUrl ? (
        <>
          <img
            src={mattedPreview || previewUrl}
            alt="Preview"
            className={`w-full h-full object-contain drop-shadow-md ${isMattingPreview && !mattedPreview ? 'opacity-0' : 'opacity-100'}`}
          />
          {isMattingPreview && !mattedPreview && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </>
      ) : (
        <div className="text-4xl">🐾</div>
      )}
      {isGenerating && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

function IndexedPreviewBox({
  previewRawUrl,
  mattedIndexed,
  isMattingIndexed,
  isGenerating,
  badge,
  successHighlight,
}: {
  previewRawUrl: string | null;
  mattedIndexed: string | null;
  isMattingIndexed: boolean;
  isGenerating: boolean;
  badge?: string | null;
  successHighlight?: boolean;
}) {
  return (
    <div
      className={`w-48 h-48 flex-shrink-0 bg-amber-50 rounded-[2rem] border-4 shadow-inner flex items-center justify-center overflow-hidden relative group transition-[box-shadow] duration-300 ${
        successHighlight ? 'border-emerald-400 ring-4 ring-emerald-300/50' : 'border-amber-200'
      }`}
    >
      {badge && (
        <span className="absolute top-2 left-2 z-20 text-[9px] font-black uppercase tracking-wide bg-indigo-600 text-white px-2 py-0.5 rounded-md shadow max-w-[90%] truncate">
          {badge}
        </span>
      )}
      {previewRawUrl ? (
        <>
          <img
            src={mattedIndexed || previewRawUrl}
            alt="Preview"
            className={`w-full h-full object-contain drop-shadow-md ${isMattingIndexed && !mattedIndexed ? 'opacity-0' : 'opacity-100'}`}
          />
          {isMattingIndexed && !mattedIndexed && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </>
      ) : (
        <div className="text-4xl">🐾</div>
      )}
      {isGenerating && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

function EmptyCollection() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 opacity-50 min-h-[200px]">
      <div className="text-4xl">🧥</div>
      <p className="font-bold text-center">
        Your collection is empty!
        <br />
        Save a look to see it here.
      </p>
    </div>
  );
}

function CustomizerShell({
  statusMsg,
  name,
  setName,
  nameFieldLabel,
  nameFieldPlaceholder,
  playerName,
  setPlayerName,
  playerFieldLabel,
  playerFieldPlaceholder,
  description,
  setDescription,
  isGenerating,
  handleGenerate,
  nameInputRef,
  playerInputRef,
  previewNode,
  saveOutfitSlot,
  collectionNode,
  footerNode,
}: {
  statusMsg: string;
  name: string;
  setName: (v: string) => void;
  nameFieldLabel: string;
  nameFieldPlaceholder: string;
  /** When set (indexed mode), first input is Hall of Fame / player name. */
  playerName?: string;
  setPlayerName?: (v: string) => void;
  playerFieldLabel?: string;
  playerFieldPlaceholder?: string;
  description: string;
  setDescription: (v: string) => void;
  isGenerating: boolean;
  handleGenerate: () => void;
  nameInputRef: React.RefObject<HTMLInputElement | null>;
  playerInputRef?: React.RefObject<HTMLInputElement | null>;
  previewNode: React.ReactNode;
  saveOutfitSlot: React.ReactNode;
  collectionNode: React.ReactNode;
  footerNode: React.ReactNode;
}) {
  const uid = useId();
  const playerFieldId = `${uid}-player`;
  const lookFieldId = `${uid}-look`;
  const descFieldId = `${uid}-desc`;
  const statusId = `${uid}-status`;

  useLayoutEffect(() => {
    const el = playerInputRef?.current ?? nameInputRef.current;
    el?.focus();
  }, [nameInputRef, playerInputRef]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${uid}-title`}
      aria-describedby={statusId}
      className="z-50 bg-white p-8 rounded-[3rem] shadow-2xl border-4 border-amber-300 w-full max-w-4xl flex flex-col gap-8 animate-[bounceIn_0.5s_ease-out] max-h-[90vh] overflow-y-auto"
    >
      <div className="text-center">
        <h2 id={`${uid}-title`} className="text-4xl font-black text-amber-900 italic tracking-tighter uppercase mb-2">
          Kitty Closet
        </h2>
        <p id={statusId} role="status" aria-live="polite" className="text-slate-600 font-bold">
          {statusMsg}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            {previewNode}
            <div className="flex-grow flex flex-col gap-4 w-full">
              {playerName !== undefined && setPlayerName && (
                <div className="relative">
                  <label htmlFor={playerFieldId} className="sr-only">
                    {playerFieldLabel ?? 'Player name'}
                  </label>
                  <input
                    ref={playerInputRef ?? undefined}
                    id={playerFieldId}
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder={playerFieldPlaceholder ?? 'Player name...'}
                    autoComplete="nickname"
                    className="w-full min-h-[48px] p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/20 outline-none font-bold text-slate-900 shadow-sm transition-all placeholder:text-slate-400"
                  />
                  <div className="absolute -top-3 -left-2 bg-emerald-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm z-10 pointer-events-none">
                    {playerFieldLabel ?? 'Player name'}
                  </div>
                </div>
              )}

              <div className="relative">
                <label htmlFor={lookFieldId} className="sr-only">
                  {nameFieldLabel}
                </label>
                <input
                  ref={nameInputRef}
                  id={lookFieldId}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  placeholder={nameFieldPlaceholder}
                  className="w-full min-h-[48px] p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/20 outline-none font-bold text-slate-900 shadow-sm transition-all placeholder:text-slate-400"
                />
                <div className="absolute -top-3 -left-2 bg-amber-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm z-10 pointer-events-none">
                  {nameFieldLabel}
                </div>
              </div>

              <div className="relative">
                <label htmlFor={descFieldId} className="sr-only">
                  New look description for AI generation
                </label>
                <textarea
                  id={descFieldId}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. wearing pink sunglasses and a floral hawaiian shirt"
                  className="w-full p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/20 outline-none h-24 font-medium text-slate-900 resize-none shadow-sm transition-all placeholder:text-slate-400"
                  disabled={isGenerating}
                />
                <div className="absolute -top-3 -left-2 bg-indigo-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm z-10 pointer-events-none">
                  New Look Description
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !description.trim()}
                className="w-full min-h-[48px] bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white font-black py-4 rounded-2xl uppercase tracking-widest transition-all shadow-md active:scale-95"
              >
                {isGenerating ? 'Generating…' : 'Generate with AI'}
              </button>
            </div>
          </div>

          <div className="flex gap-4 flex-wrap">{saveOutfitSlot}</div>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-xl font-black text-amber-900 uppercase italic tracking-tighter">My Collection</h3>
          <div className="bg-amber-50/50 rounded-[2rem] border-2 border-amber-100 p-6 flex-grow min-h-[300px] max-h-[400px] overflow-y-auto">
            {collectionNode}
          </div>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap border-t-2 border-amber-50 pt-6">{footerNode}</div>
    </div>
  );
}

export default CatCustomizer;

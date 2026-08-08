import { contextBridge, ipcRenderer } from 'electron'

// Pont minimal pour les petites fenêtres autonomes de mise à jour (choix
// "Mettre à jour" / "Plus tard"), séparé du preload principal de l'appli :
// ces fenêtres n'ont besoin de rien d'autre.
contextBridge.exposeInMainWorld('updateDialogApi', {
  choose: (value: 'update' | 'later'): void => ipcRenderer.send('update-dialog:choice', value)
})

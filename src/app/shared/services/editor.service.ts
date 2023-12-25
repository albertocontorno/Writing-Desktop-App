import { ProjectService } from './project.service';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { DataChangeEvent } from '../components/editor/models/DataChangeEvent.model';
import { HistoryPlugin } from '../components/editor/plugins/History/HistoryPlugin';
import { HistoryCachedEMap, HistoryChacheEntry } from '../models/internals/HistoryCache.model';


@Injectable({
  providedIn: 'root'
})
export class EditorService {
  onChanges$: Subject<DataChangeEvent> = new Subject<DataChangeEvent>();

  histories: HistoryCachedEMap = {};
  history: HistoryPlugin;

  constructor(private projectService: ProjectService) {
    projectService.onChange$.subscribe( _ => {
      this.histories = {};
    });
  }

  addHistory(fileId: string, history: HistoryChacheEntry){
    this.histories[fileId] = history;
  }

  deleteHistory(fileId: string){
    delete this.histories[fileId];
  }

  getHistory(fileId: string): HistoryChacheEntry{
    return this.histories[fileId];
  }

  setHistoryPlugin(history: HistoryPlugin){
    this.history = history;
  }
}

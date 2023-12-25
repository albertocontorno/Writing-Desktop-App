import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss']
})
export class TabsComponent implements OnInit {

  @Input() tabs: any[];
  @Input() activeTabIndex: number;
  @Output() onTabClicked: EventEmitter<any> = new EventEmitter();
  @Output() onCloseTab: EventEmitter<any> = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
  }

  tabClicked(index: number, tab){
    this.activeTabIndex = index;
    this.onTabClicked.next({index, tab});
  }

  closeTab(index: number, tab){
    this.onCloseTab.next({index, tab});
  }

  drop(event: CdkDragDrop<string[]>) {
    const openedTab = this.tabs[this.activeTabIndex];
    moveItemInArray(this.tabs, event.previousIndex, event.currentIndex);
    this.activeTabIndex = this.tabs.findIndex( t => t === openedTab );
  }

  dragStart(e){
    console.log('???', e)
  }

}

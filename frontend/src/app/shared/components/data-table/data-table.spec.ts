import { TestBed } from '@angular/core/testing';
import { DataTable } from './data-table';
function setup() {
  const fixture = TestBed.createComponent(DataTable);
  fixture.componentRef.setInput('rows', []);
  fixture.componentRef.setInput('columns', [{ key: 'name', label: 'Name' }]);
  fixture.componentRef.setInput('query', {
    search: '',
    page: 1,
    pageSize: 8,
    sort: 'name',
    direction: 'desc',
  });
  fixture.componentRef.setInput('total', 16);
  fixture.detectChanges();
  return fixture;
}
describe('DataTable', () => {
  it('emits sort and pagination changes and prevents out-of-range navigation', () => {
    const fixture = setup();
    const emit = jest.fn();
    fixture.componentInstance.queryChange.subscribe(emit);
    (fixture.nativeElement.querySelector('th button') as HTMLButtonElement).click();
    expect(emit).toHaveBeenCalledWith(
      expect.objectContaining({ sort: 'name', direction: 'asc', page: 1 }),
    );
    fixture.componentInstance.page(1);
    expect(emit).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
    emit.mockClear();
    fixture.componentInstance.page(-1);
    expect(emit).not.toHaveBeenCalled();
  });
  it('presents distinct empty, error and loading states', () => {
    const fixture = setup();
    expect(fixture.nativeElement.textContent).toContain('No records');
    fixture.componentRef.setInput('error', 'Service unavailable');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'Service unavailable',
    );
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
      'Loading results',
    );
  });
});

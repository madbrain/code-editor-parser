<span>
	<span class="{textClass(!value)}">{leftLabel}</span>
	<label class="switch">
		<input type="checkbox" on:click="toggle()" checked="{value}">
		<span class="slider round" />
	</label>
	<span class={textClass(value)}> {rightLabel}</span>
</span>

<style>
  .switch {
    position: relative;
    display: inline-block;
    width: 54px;
    height: 28px;
    bottom: -6px;
  }

  .switch input {
    display: none;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #2196f3;
    -webkit-transition: 0.4s;
    transition: 0.4s;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 22px;
    width: 22px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    -webkit-transition: 0.4s;
    transition: 0.4s;
  }

  input:focus + .slider {
    box-shadow: 0 0 1px #2196f3;
  }

  input:checked + .slider:before {
    -webkit-transform: translateX(26px);
    -ms-transform: translateX(26px);
    transform: translateX(26px);
  }

  .slider.round {
    border-radius: 34px;
  }

  .slider.round:before {
    border-radius: 50%;
  }

  .on {
    color: black;
  }

  .off {
    color: #aaa;
  }
</style>

<script>
    export default {
      helpers: {
        textClass(value) {
          return value ? "on" : "off";
        }
      },
      methods: {
			toggle() {
                const newValue = ! this.get().value;
                this.set({ value: newValue });
                this.fire('change', { value: newValue });
			}
		},
      data() {
        return {
          value: false,
          leftLabel: "",
          rightLabel: ""
        };
      }
    };
</script>